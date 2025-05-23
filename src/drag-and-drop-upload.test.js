// src/drag-and-drop-upload.test.js
import './drag-and-drop-upload.js'; // Ensure the component is defined

describe('DragAndDropUpload Core Functionality', () => {
    let element;

    beforeEach(() => {
        // Create a new instance of the component for each test
        element = document.createElement('drag-and-drop-upload');
        // Note: connectedCallback is called when appended to document.
        // Attributes are set before appending to ensure they are available in constructor/connectedCallback
    });

    afterEach(() => {
        // Clean up by removing the element from the JSDOM body
        if (document.body.contains(element)) {
            document.body.removeChild(element);
        }
    });

    describe('Component Instantiation', () => {
        test('should be defined with customElements', () => {
            expect(customElements.get('drag-and-drop-upload')).toBeDefined();
        });

        test('should be an instance of HTMLElement', () => {
            expect(element).toBeInstanceOf(HTMLElement);
        });

        test('should upgrade to DragAndDropUpload class instance', () => {
            // The class DragAndDropUpload is not exported, so we check its registration
            // and that it's an HTMLElement. Specific class instance check is harder without export.
            document.body.appendChild(element); // Required for upgrade and initialization
            expect(element.constructor.name).toBe('DragAndDropUpload');
        });
    });

    describe('data-title attribute', () => {
        test('should display custom title when data-title is set', () => {
            const customTitle = "My Test Uploader";
            element.setAttribute('data-title', customTitle);
            document.body.appendChild(element); // Triggers connectedCallback and title update
            
            const titleElement = element.shadowRoot.getElementById('title-header');
            expect(titleElement).not.toBeNull();
            expect(titleElement.textContent).toBe(customTitle);
        });

        test('should display default title if data-title is not set', () => {
            // No data-title attribute set
            document.body.appendChild(element); // Triggers connectedCallback
            
            const titleElement = element.shadowRoot.getElementById('title-header');
            expect(titleElement).not.toBeNull();
            // The component's constructor sets a default if attribute is null
            // but if attribute is present but empty, it might be empty.
            // Based on current component code, if attribute is missing, title is not set by getAttribute
            // and the default H3 content "Drag and Drop Uploader" remains.
            // If getAttribute('data-title') returns null, title.textContent = null, which means it uses the default.
            expect(titleElement.textContent).toBe('Drag and Drop Uploader');
        });

        test('should display empty title if data-title is set to an empty string', () => {
            element.setAttribute('data-title', '');
            document.body.appendChild(element);
            
            const titleElement = element.shadowRoot.getElementById('title-header');
            expect(titleElement).not.toBeNull();
            expect(titleElement.textContent).toBe('');
        });
    });

    describe('upload-url attribute', () => {
        test('should correctly set upload URL when upload-url is set', () => {
            const testUrl = "/test-upload";
            element.setAttribute('upload-url', testUrl);
            document.body.appendChild(element); // Triggers connectedCallback
            
            // Access the form's action attribute within the shadow DOM
            const formElement = element.shadowRoot.getElementById('upload-form');
            expect(formElement).not.toBeNull();
            // The action property of a form returns the fully qualified URL
            expect(formElement.action).toBe(`http://localhost${testUrl}`); // JSDOM prepends http://localhost
            // Also check the internal 'url' property if it's meant to be directly accessed
            expect(element.url).toBe(testUrl);
        });

        test('should have null or empty URL if upload-url is not set', () => {
            document.body.appendChild(element);
            
            const formElement = element.shadowRoot.getElementById('upload-form');
            expect(formElement).not.toBeNull();
            // If attribute is not set, url property will be null
            expect(element.url).toBeNull();
            // Form action might default to the current document's URL if not set
            // Depending on browser/JSDOM, this might be 'about:blank' or similar if not appended
            // or the current page's URL if appended.
            // For our component, if `this.url` is null, `uploadForm.action` is not explicitly set to null.
            // Let's check if it's not set to a user-defined value.
            // The default JSDOM URL is 'http://localhost/'
            expect(formElement.action).toBe('http://localhost/'); // default JSDOM URL
        });
    });

    describe('file-type attribute', () => {
        test('should correctly set fileTypeAttribute when file-type is set', () => {
            const testFileType = "image/png";
            element.setAttribute('file-type', testFileType);
            document.body.appendChild(element); // Triggers connectedCallback
            
            // Access the component instance's fileTypeAttribute property
            expect(element.fileTypeAttribute).toBe(testFileType);
        });

        test('should have an empty string for fileTypeAttribute if file-type is not set', () => {
            document.body.appendChild(element);
            
            // As per component's constructor: this.fileTypeAttribute = this.getAttribute('file-type') || "";
            expect(element.fileTypeAttribute).toBe("");
        });

         test('should correctly set fileTypeAttribute when file-type is set to an empty string', () => {
            element.setAttribute('file-type', "");
            document.body.appendChild(element); 
            
            expect(element.fileTypeAttribute).toBe("");
        });
    });

    describe('Drag and Drop Event Handling', () => {
        let dropArea;

        beforeEach(() => {
            // Element is already created and appended in the outer beforeEach for Core Functionality
            // Ensure it's in the document for event listeners to be active
            if (!document.body.contains(element)) {
                 document.body.appendChild(element);
            }
            dropArea = element.shadowRoot.getElementById('drop-area');
            expect(dropArea).not.toBeNull(); // Ensure dropArea is found
        });

        test('should highlight on dragenter and dragover', () => {
            const dragEnterEvent = new DragEvent('dragenter', { bubbles: true, cancelable: true });
            dropArea.dispatchEvent(dragEnterEvent);
            expect(dropArea.classList.contains('highlight')).toBe(true);

            const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
            dropArea.dispatchEvent(dragOverEvent);
            expect(dropArea.classList.contains('highlight')).toBe(true);
        });

        test('should unhighlight on dragleave', () => {
            dropArea.classList.add('highlight'); // Setup: ensure it's highlighted
            
            const dragLeaveEvent = new DragEvent('dragleave', { bubbles: true, cancelable: true });
            dropArea.dispatchEvent(dragLeaveEvent);
            expect(dropArea.classList.contains('highlight')).toBe(false);
        });

        test('should unhighlight on drop', () => {
            dropArea.classList.add('highlight'); // Setup: ensure it's highlighted

            const mockDropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
            Object.defineProperty(mockDropEvent, 'dataTransfer', {
                value: { files: [] },
            });
            dropArea.dispatchEvent(mockDropEvent);
            expect(dropArea.classList.contains('highlight')).toBe(false);
        });

        describe('handleDrop Method and File Processing', () => {
            let handleFilesSpy;

            beforeEach(() => {
                // Spy on the component's handleFiles method
                handleFilesSpy = jest.spyOn(element, 'handleFiles');
            });

            afterEach(() => {
                // Restore the original method after each test in this suite
                if (handleFilesSpy) {
                    handleFilesSpy.mockRestore();
                }
            });

            test('should call handleFiles with dropped files', () => {
                const file1 = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
                const file2 = new File(['content'], 'test.txt', { type: 'text/plain' });
                const mockFiles = [file1, file2];

                const mockDropEvent = new DragEvent('drop', { bubbles: true, cancelable: true });
                Object.defineProperty(mockDropEvent, 'dataTransfer', {
                    value: { files: mockFiles },
                });

                dropArea.dispatchEvent(mockDropEvent);

                expect(handleFilesSpy).toHaveBeenCalledTimes(1);
                // JSDOM's FileList might not be a direct array, but an array-like object.
                // We check if the first file's name matches, as a proxy for correct FileList passing.
                expect(handleFilesSpy).toHaveBeenCalledWith(
                    expect.objectContaining({
                        0: file1,
                        1: file2,
                        length: 2
                    })
                );
            });
        });
        
        describe('Prevent Default Event Behaviors', () => {
            const eventsToTest = ['dragenter', 'dragover', 'dragleave', 'drop'];

            eventsToTest.forEach(eventName => {
                test(`should call preventDefault for ${eventName} on dropArea`, () => {
                    const event = new DragEvent(eventName, { bubbles: true, cancelable: true });
                    // For 'drop' event, dataTransfer.files is accessed, so it needs to be defined.
                    if (eventName === 'drop') {
                        Object.defineProperty(event, 'dataTransfer', {
                            value: { files: [] },
                        });
                    }
                    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
                    
                    dropArea.dispatchEvent(event);
                    expect(preventDefaultSpy).toHaveBeenCalled();
                    preventDefaultSpy.mockRestore();
                });

                // Test preventDefault on document.body as well, as per component's initializeDragAndDrop
                // Note: This might be tricky if JSDOM event bubbling/capturing for document.body isn't straightforward
                // or if the component's listeners are not set up on document.body in test env as expected.
                // For simplicity, we'll focus on dropArea which is directly controlled.
                // If testing document.body is crucial, further setup might be needed.
            });
        });
    });

    describe('File Upload Logic', () => {
        let mockXHR;
        let mockFormDataAppend;
        let alertSpy;
        const mockFile = new File(['content'], 'testfile.txt', { type: 'text/plain' });
        const uploadUrl = '/test-upload-endpoint';
        const fileType = 'text/custom';

        beforeEach(() => {
            // Element is created in the outer describe's beforeEach
            // but attributes and appending to body needs to happen here for this context
            element.setAttribute('upload-url', uploadUrl);
            element.setAttribute('file-type', fileType);
            if (!document.body.contains(element)) {
                 document.body.appendChild(element);
            }
            
            alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            mockFormDataAppend = jest.spyOn(FormData.prototype, 'append');
            
            mockXHR = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn(),
                readyState: 4,
                status: 200, // Default to success, changed per test
                statusText: 'OK', // Default
                // component will assign these, we'll call them manually
                onload: null, 
                onerror: null,
            };
            window.XMLHttpRequest = jest.fn(() => mockXHR);
        });

        afterEach(() => {
            alertSpy.mockRestore();
            mockFormDataAppend.mockRestore();
            jest.restoreAllMocks(); // Restores all spies created with jest.spyOn
        });

        describe('uploadFile - Successful Upload', () => {
            beforeEach(() => {
                mockXHR.status = 200;
                mockXHR.statusText = 'OK';
                element.fileInputElement.value = 'fakepath/testfile.txt'; // Simulate file selected
                element.uploadFile(mockFile, 0);
                if (mockXHR.onload) {
                    mockXHR.onload(); // Trigger success
                }
            });

            test('should call XMLHttpRequest methods correctly', () => {
                expect(mockXHR.open).toHaveBeenCalledWith('POST', uploadUrl, true);
                expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('X-Requested-With', 'XMLHttpRequest');
            });

            test('should append correct data to FormData', () => {
                expect(mockFormDataAppend).toHaveBeenCalledWith('FileType', fileType);
                expect(mockFormDataAppend).toHaveBeenCalledWith('FileDetails', mockFile);
                expect(mockXHR.send).toHaveBeenCalledWith(expect.any(FormData));
            });

            test('should show success alert', () => {
                expect(alertSpy).toHaveBeenCalledWith("File '" + mockFile.name + "' uploaded successfully.");
            });

            test('should clear file input on success', () => {
                expect(element.fileInputElement.value).toBe('');
            });
        });

        describe('uploadFile - Server Error', () => {
            beforeEach(() => {
                mockXHR.status = 500;
                mockXHR.statusText = 'Internal Server Error';
                element.fileInputElement.value = 'fakepath/testfile.txt'; // Simulate file selected
                element.uploadFile(mockFile, 0);
                if (mockXHR.onload) {
                    mockXHR.onload(); // Trigger error via onload
                }
            });

            test('should show server error alert', () => {
                expect(alertSpy).toHaveBeenCalledWith("Upload failed for '" + mockFile.name + "': " + mockXHR.statusText);
            });

            test('should not clear file input on server error', () => {
                expect(element.fileInputElement.value).toBe('fakepath/testfile.txt');
            });
        });

        describe('uploadFile - Network Error', () => {
            beforeEach(() => {
                element.fileInputElement.value = 'fakepath/testfile.txt'; // Simulate file selected
                element.uploadFile(mockFile, 0);
                if (mockXHR.onerror) {
                    mockXHR.onerror(); // Trigger network error
                }
            });
            
            test('should show network error alert', () => {
                expect(alertSpy).toHaveBeenCalledWith("Error uploading file '" + mockFile.name + "'. Please try again.");
            });

            test('should not clear file input on network error', () => {
                expect(element.fileInputElement.value).toBe('fakepath/testfile.txt');
            });
        });

        describe('handleFiles Method', () => {
            let uploadFileSpy;

            beforeEach(() => {
                uploadFileSpy = jest.spyOn(element, 'uploadFile');
            });
            
            test('should call uploadFile for each file', () => {
                const mockFile1 = new File(['file1'], 'file1.txt', { type: 'text/plain' });
                const mockFile2 = new File(['file2'], 'file2.pdf', { type: 'application/pdf' });
                const mockFilesArray = [mockFile1, mockFile2];

                element.handleFiles(mockFilesArray);

                expect(uploadFileSpy).toHaveBeenCalledTimes(2);
                expect(uploadFileSpy).toHaveBeenCalledWith(mockFile1, 0);
                expect(uploadFileSpy).toHaveBeenCalledWith(mockFile2, 1);
            });
        });
    });

    describe('File Input ("Choose File") Interaction', () => {
        let fileInput;
        let handleFilesSpy;

        beforeEach(() => {
            // Element is created in the outer describe's beforeEach
            // Appending to body ensures connectedCallback (and event listener setup) is called
            if (!document.body.contains(element)) {
                 document.body.appendChild(element);
            }
            fileInput = element.shadowRoot.getElementById('FileDetails');
            expect(fileInput).not.toBeNull(); // Ensure file input is found

            handleFilesSpy = jest.spyOn(element, 'handleFiles');
        });

        afterEach(() => {
            if (handleFilesSpy) {
                handleFilesSpy.mockRestore();
            }
            // It's also good practice to clear the mock on fileInput.files if it might affect other tests,
            // though Jest's environment isolation often handles this.
            // If fileInput instance was somehow shared/persisted across tests (not typical for this setup):
            // Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
        });

        test('should call handleFiles with selected files on input change event', () => {
            const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
            const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });
            const mockSelectedFiles = [file1, file2];

            // Mock the 'files' property on the input element.
            // This is crucial because JSDOM's HTMLInputElement.files is read-only by default.
            Object.defineProperty(fileInput, 'files', {
                value: mockSelectedFiles,
                writable: false, // As per original component, it's read, not written to by component
                configurable: true // Allow redefining for other tests if necessary
            });
            
            // Dispatch the change event
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);

            expect(handleFilesSpy).toHaveBeenCalledTimes(1);
            
            // The component's handleFilesEvent calls this.handleFiles(event.currentTarget.files)
            // So we expect handleFiles to be called with mockSelectedFiles
            // JSDOM's FileList might be array-like, so check contents carefully.
            const passedFilesArgument = handleFilesSpy.mock.calls[0][0];
            expect(passedFilesArgument.length).toBe(mockSelectedFiles.length);
            expect(passedFilesArgument[0]).toBe(mockSelectedFiles[0]);
            expect(passedFilesArgument[1]).toBe(mockSelectedFiles[1]);
            // A more robust check for array-like objects:
            expect(Array.from(passedFilesArgument)).toEqual(expect.arrayContaining(mockSelectedFiles));
        });

        test('should call handleFiles with an empty list if no files are selected', () => {
            const mockSelectedFiles = []; // Empty array for no files

            Object.defineProperty(fileInput, 'files', {
                value: mockSelectedFiles,
                configurable: true
            });
            
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);

            expect(handleFilesSpy).toHaveBeenCalledTimes(1);
            const passedFilesArgument = handleFilesSpy.mock.calls[0][0];
            expect(passedFilesArgument.length).toBe(0);
        });
    });
});
