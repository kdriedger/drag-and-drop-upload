//
// drag and drop upload web component
//
class DragAndDropUpload extends HTMLElement {
    constructor() {
        super();
        const style = `
            #drop-area {
                border: 2px dashed #ccc;
                border-radius: 20px;
                width: 480px;
                margin: 50px auto;
                padding: 20px;
            }

                #drop-area.highlight {
                    border-color: purple;
                }
        `;

        const html = `
            <div id="drop-area">
                <form id="upload-form" enctype="multipart/form-data" method="post">
                    <div id="divImportDocuments" class="panel">

                        <div class="panel-heading">
                            <h3 id="title-header" class="panel-title">Drag and Drop Uploader</h3>
                        </div>
                        <p><abbr title="Click 'Choose File' button or drag and drop a file from Windows Explorer">Help</abbr></p>
                        <div id="ImportDocuments" class="panel-body">
                            <div>
                                <input id="FileDetails" multiple="true" name="FileDetails" type="file" value="">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        `;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
              ${style}
            </style>
            ${html}
        `;

        this.dropArea = this.shadowRoot.getElementById('drop-area');

        const text = this.getAttribute('data-title');
        const title = this.shadowRoot.getElementById('title-header');
        title.textContent = text;

        this.url = this.getAttribute('upload-url');

        const uploadForm = this.shadowRoot.getElementById('upload-form');
        uploadForm.action = this.url;

        this.fileInputElement = this.shadowRoot.getElementById('FileDetails');

        this.initializeDragAndDrop.bind(this);
        this.handleDrop.bind(this);
        this.handleFiles.bind(this);
        this.uploadFile.bind(this);
    }

    initializeDragAndDrop() {

        // Prevent default drag behaviors
        ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, e => this.preventDefaults(e), false);
            document.body.addEventListener(eventName, e => this.preventDefaults(e), false);
        })

            // Highlight drop area when item is dragged over it
            ;['dragenter', 'dragover'].forEach(eventName => {
                this.dropArea.addEventListener(eventName, e => this.highlight(e), false);
            })

            ;['dragleave', 'drop'].forEach(eventName => {
                this.dropArea.addEventListener(eventName, e => this.unhighlight(e), false);
            })

        // Handle dropped files
        // btw, the fat arrow function for the event listener binds the web component to "this"... which is what I expect.
        this.dropArea.addEventListener('drop', e => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    highlight(e) {
        e.currentTarget.classList.add('highlight');
    }

    unhighlight(e) {
        e.currentTarget.classList.remove('highlight');
    }


    handleDrop(e) {
        var dt = e.dataTransfer;
        var files = dt.files;

        this.handleFiles(files);
    }

    handleFilesEvent(event) {
        this.handleFiles(event.currentTarget.files);
    }

    handleFiles(files) {
        files = [...files];
        files.forEach((file, i) => this.uploadFile(file, i));
    }

    uploadFile(file, i) {
        var url = this.url;
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        // the name of the form data must be the same as the name of the property of the C# class LibraryItemDocumentViewModel called FileDetails
        // also see DocumentController method "public ActionResult UploadFile(LibraryItemDocumentViewModel documentViewModel, int crid)"
        formData.append('FileDetails', file)
        xhr.send(formData)
    }

    connectedCallback() {
        this.initializeDragAndDrop();
        this.fileInputElement.addEventListener('change', e => this.handleFilesEvent(e), false);
    }

    disconnectedCallback() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.removeEventListener(eventName, preventDefaults);
            document.body.removeEventListener(eventName, preventDefaults);
        })

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.removeEventListener(eventName, highlight);
        })

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.removeEventListener(eventName, unhighlight);
        })

        // Handle dropped files
        this.dropArea.removeEventListener('drop', this.handleDrop, false)

        this.fileInputElement.removeEventListener('change', e => this.handleFilesEvent(e));
    }
}

customElements.define('drag-and-drop-upload', DragAndDropUpload);
