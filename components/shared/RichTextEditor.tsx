"use client";

import { uploadEditorImageAction } from "@/app/actions/upload";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "react-hot-toast";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

interface EditorBlobInfo {
  blob: () => Blob;
  filename: () => string;
}

const uploadFile = async (file: Blob, filename: string): Promise<string> => {
  const formData = new FormData();
  formData.set("image", file, filename);

  const res = await uploadEditorImageAction(formData);
  if (!res.ok || !res.data) {
    throw res.error || "Image upload failed";
  }
  return res.data.url;
};

// Uploads a pasted/dropped/picked image to the backend (imgbb-hosted) and
// hands TinyMCE back the URL to embed, instead of inlining it as base64.
const handleImageUpload = (blobInfo: EditorBlobInfo): Promise<string> =>
  uploadFile(blobInfo.blob(), blobInfo.filename());

// Backs both the image dialog's "Browse" button and our own text/image
// columns dialog's image field (both use urlinput with filetype: "image").
const handleFilePicker = (
  callback: (url: string, meta?: Record<string, unknown>) => void,
) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(file, file.name);
      callback(url, { alt: file.name.replace(/\.[^.]+$/, "") });
    } catch (err) {
      toast.error(typeof err === "string" ? err : "Image upload failed");
    }
  };
  input.click();
};

const COLUMN_RATIO_OPTIONS = [
  { text: "Text 50% / Image 50%", value: "50-50" },
  { text: "Text 70% / Image 30%", value: "70-30" },
  { text: "Text 60% / Image 40%", value: "60-40" },
  { text: "Text 40% / Image 60%", value: "40-60" },
  { text: "Text 30% / Image 70%", value: "30-70" },
];

// Inserts a two-column block: one side a text placeholder, the other an
// uploaded image, at whatever width split the user picks. Built as a plain
// flex <div> with inline styles (rather than a table) so it survives being
// saved as raw HTML and rendered anywhere later.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const openTextImageColumnsDialog = (editor: any) => {
  editor.windowManager.open({
    title: "Insert Text + Image Columns",
    body: {
      type: "panel",
      items: [
        {
          type: "selectbox",
          name: "ratio",
          label: "Column widths",
          items: COLUMN_RATIO_OPTIONS,
        },
        {
          type: "selectbox",
          name: "side",
          label: "Layout",
          items: [
            { text: "Text left, Image right", value: "text-left" },
            { text: "Image left, Text right", value: "image-left" },
          ],
        },
        {
          type: "urlinput",
          name: "imageUrl",
          label: "Image",
          filetype: "image",
        },
      ],
    },
    buttons: [
      { type: "cancel", text: "Cancel" },
      { type: "submit", text: "Insert", primary: true },
    ],
    initialData: {
      ratio: "50-50",
      side: "text-left",
      imageUrl: { value: "" },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (api: any) => {
      const data = api.getData();
      const imageUrl = String(data.imageUrl?.value || "").trim();
      if (!imageUrl) {
        editor.notificationManager.open({
          text: "Please choose an image.",
          type: "error",
        });
        return;
      }

      const [textPct, imagePct] = data.ratio.split("-").map(Number);
      const textColumn = `<div style="flex:0 0 ${textPct}%; max-width:${textPct}%; box-sizing:border-box; padding:0 8px;"><p>Write your text here…</p></div>`;
      const imageColumn = `<div style="flex:0 0 ${imagePct}%; max-width:${imagePct}%; box-sizing:border-box; padding:0 8px;"><img src="${imageUrl}" alt="" style="width:100%; height:auto; display:block; border-radius:8px;" /></div>`;

      const columns =
        data.side === "text-left"
          ? textColumn + imageColumn
          : imageColumn + textColumn;

      editor.insertContent(
        `<div style="display:flex; flex-wrap:wrap; align-items:flex-start; gap:16px; margin:16px 0;">${columns}</div><p>&nbsp;</p>`,
      );
      api.close();
    },
  });
};

// Self-hosted TinyMCE — assets are copied into public/tinymce on `npm install`
// (see scripts/copy-tinymce.mjs), so this needs no Tiny Cloud API key and
// shows no eval-mode nag banner.
const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  height = 320,
}: RichTextEditorProps) => {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={value}
      onEditorChange={onChange}
      init={{
        height,
        menubar: false,
        statusbar: false,
        placeholder,
        plugins: ["lists", "link", "autolink", "table", "image", "media"],
        toolbar:
          "bold italic underline forecolor backcolor | bullist numlist | link image media table textimagecolumns | alignleft aligncenter alignright | removeformat",
        content_style:
          "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; }",
        branding: false,
        // Table toolbar/menu shown when a table cell is focused.
        table_toolbar:
          "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",
        // Images upload through handleImageUpload instead of being inlined
        // as base64, so saved content stays small.
        images_upload_handler: handleImageUpload,
        automatic_uploads: true,
        // Video: pasting/inserting a YouTube/Vimeo/mp4 URL via the "media"
        // toolbar button embeds a player — no file hosting needed for that.
        media_live_embeds: true,
        // Powers the "Browse" button on any image urlinput field (the
        // built-in image dialog's Source field, and our columns dialog's
        // Image field below).
        file_picker_types: "image",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        file_picker_callback: (callback: any) => handleFilePicker(callback),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setup: (editor: any) => {
          editor.ui.registry.addIcon(
            "textImageColumns",
            '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M3 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Zm2 1v12h4V6H5Z" fill-rule="evenodd"/><path d="M13 5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V5Z"/></svg>',
          );
          editor.ui.registry.addButton("textimagecolumns", {
            icon: "textImageColumns",
            tooltip: "Insert text + image columns",
            onAction: () => openTextImageColumnsDialog(editor),
          });
        },
      }}
    />
  );
};

export default RichTextEditor;
