# drag-and-drop-upload

A simple, dependency-free web component that provides a drag-and-drop interface for file uploads.

## Features

*   Easy integration as a standard web component.
*   File uploads via drag-and-drop or traditional file input.
*   Customizable upload endpoint and title.
*   Visual feedback for drag-over events.

## Usage

To use the component, include the JavaScript file in your HTML:

```html
<script src="src/drag-and-drop-upload.js"></script>
```

Then, you can add the component to your page like this:

```html
<drag-and-drop-upload 
    upload-url="/your-upload-endpoint" 
    data-title="Upload Your Files">
</drag-and-drop-upload>
```

## Attributes

*   `upload-url` (required): The URL where files will be uploaded.
*   `data-title` (optional): The title displayed on the component. Defaults to "Drag and Drop Uploader".

Note: Internally, there's a `FileType` property used when constructing the `FormData` for the upload. This might become an attribute in future versions for more explicit control over the data sent.

## Backend Integration

The component sends files as `multipart/form-data` via a `POST` request. 
*   The file is sent under the field name `FileDetails`.
*   The `FileType` (if set, though currently not via an attribute) is sent as another field in the `FormData`.

Your server-side application should be configured to handle `multipart/form-data` requests and access the file using the `FileDetails` field name.

## Running Tests

This project uses [Jest](https://jestjs.io/) for unit testing. To run the tests:

1.  **Install Dependencies:**
    If you haven't already, install the necessary development dependencies:
    ```bash
    npm install
    ```

2.  **Run Tests:**
    Execute the test suite using:
    ```bash
    npm test
    ```

These tests cover core component functionality, attribute handling (like `data-title`, `upload-url`, `file-type`), drag and drop event interactions, file input change events, and the file upload logic (including XHR mocking and FormData construction).
