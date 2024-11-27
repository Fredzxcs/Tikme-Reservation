export function createModal(title, onSave) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="eventType">Type of Event:</label>
                    <input type="text" id="eventType" class="form-input">
                </div>
                <div class="form-group">
                    <label for="customerName">Customer Name:</label>
                    <input type="text" id="customerName" class="form-input">
                </div>
                <div class="form-group">
                    <label for="contactNumber">Contact Number:</label>
                    <input type="text" id="contactNumber" class="form-input">
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-btn">Cancel</button>
                <button class="save-btn">Save Changes</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = modal.querySelector('.cancel-btn');
    const saveBtn = modal.querySelector('.save-btn');
    const eventTypeInput = modal.querySelector('#eventType');
    const customerNameInput = modal.querySelector('#customerName');
    const contactNumberInput = modal.querySelector('#contactNumber');

    const closeModal = () => {
        modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    saveBtn.addEventListener('click', () => {
        const formData = {
            type: eventTypeInput.value,
            customerName: customerNameInput.value,
            contactNumber: contactNumberInput.value
        };

        if (formData.type && formData.customerName && formData.contactNumber) {
            onSave(formData);
            closeModal();
        } else {
            alert('Please fill in all fields');
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    return {
        setValues: (data) => {
            eventTypeInput.value = data.type;
            customerNameInput.value = data.customerName;
            contactNumberInput.value = data.contactNumber;
        }
    };
}