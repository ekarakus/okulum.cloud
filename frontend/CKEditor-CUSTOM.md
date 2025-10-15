Creating a custom CKEditor 5 build for this project

Goal
- Provide a custom CKEditor 5 build package named `@ckeditor/ckeditor5-build-custom` that includes plugins required by the app (e.g. Font, FontBackgroundColor, TodoList, UploadAdapter support, etc.) and exports a ready-to-use editor.

Steps (recommended)
1. Use the official CKEditor 5 online builder or a local custom build.

Option A — Online builder (quick)
- Go to https://ckeditor.com/ckeditor-5/online-builder/
- Choose the Classic editor base.
- Add the needed plugins (Font, FontFamily, FontSize, FontColor, Highlight, TodoList, List, Alignment, Image, ImageUpload, Link, CodeBlock, BlockQuote, Table, Indent, Outdent, SpecialCharacters, MediaEmbed, etc.)
- Set toolbar order matching your desired `toolbar.items`.
- Build and download the zip. Unpack and you'll have a `build` folder containing `ckeditor.js` and some assets.
- Create a local npm package from the build: e.g. in `frontend/ckeditor-custom` create a `package.json`:
  {
    "name": "@ckeditor/ckeditor5-build-custom",
    "version": "1.0.0",
    "main": "build/ckeditor.js",
    "files": ["build"]
  }
- Copy the build output into `frontend/ckeditor-custom/build` and run:
  ```bash
  cd frontend/ckeditor-custom
  npm pack
  ```
- Install the generated tgz into the project:
  ```bash
  cd frontend
  npm install ../ckeditor-custom/ckeditor-custom-1.0.0.tgz
  ```
- Now the application dynamic import will prefer `@ckeditor/ckeditor5-build-custom`.

Option B — Local custom build (more control)
- Clone the `ckeditor5` build repository template or use the monorepo tools per CKEditor docs.
- Follow CKEditor 5 docs to add plugins and build with webpack/rollup.
- Publish the build to a private registry or add it locally as in Option A.

Notes
- After installing the custom build as `@ckeditor/ckeditor5-build-custom`, restart dev server and the editor will load the custom build automatically.
- If you prefer not to package the build as `@ckeditor/ckeditor5-build-custom`, you can import it directly by path and update the import in `announcement-add-edit-dialog.component.ts`.
- If new toolbar items still don't appear, verify that the installed build actually includes the corresponding plugin names (e.g. `Font`, `TodoList`, etc.).

If you'd like, I can generate a `ckeditor-custom` folder skeleton and a local `package.json` for you to drop in the build output. Tell me which option you prefer.
