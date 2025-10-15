How to add a custom CKEditor 5 build (Option A - online builder)

1. Use CKEditor online builder
   - Visit: https://ckeditor.com/ckeditor-5/online-builder/
   - Select Classic build as base.
   - Add desired plugins: Font, FontFamily, FontSize, FontColor, FontBackgroundColor (if available), TodoList, List, Alignment, Image, ImageUpload, Link, CodeBlock, BlockQuote, Table, Indent/Outdent, SpecialCharacters, MediaEmbed, etc.
   - Arrange the toolbar items in the builder to match the required order.
   - Build and download the generated zip file.

2. Copy build output into this folder
   - Unpack the zip. It should contain a `build/ckeditor.js` and assets.
   - Copy the `build` directory into `frontend/ckeditor-custom/` so the path is `frontend/ckeditor-custom/build/ckeditor.js`.

3. Install the local package into the frontend project
   - From PowerShell (project root `frontend`):

```powershell
cd "C:\Users\ergun\OneDrive\Desktop\okulum.cloud\frontend"
# pack the local package (creates a .tgz)
npm pack ./ckeditor-custom
# install the packed tgz into your project
npm install --no-save .\ckeditor-custom-1.0.0.tgz
```

4. Restart the dev server
   - The app's editor code tries to import `@ckeditor/ckeditor5-build-custom` first; after installing this package the import should resolve and the custom build will be used.

5. Verify
   - Start the dev server, open the edit dialog and verify toolbar items are present and image upload works.

If you want, I can also create a helper script to automate `npm pack` + `npm install` from inside the project. Tell me if you'd like that.
