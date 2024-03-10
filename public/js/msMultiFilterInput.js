class MultiFilterInput {
    constructor(container){
        this.container = container;
        this.selectedOptions = [];
        this.selectedItemsContainer = document.createElement('div');
        this.selectedItemsContainer.className = 'selected-items-container';
        this.init();
    }

    init() {
        this.filterInput = document.createElement('input');
        this.filterInput.type = 'text';
        this.filterInput.placeholder = 'Select items...';
        this.filterInput.readOnly = true;
        this.filterInput.onclick = () => this.toggleOptions();

        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'options-container';

        this.container.className = 'multiFilter';
        this.container.appendChild(this.selectedItemsContainer);
        this.container.appendChild(this.filterInput);
        this.container.appendChild(this.optionsContainer);

        document.addEventListener('click', (e) => {
            if (!this.filterInput.contains(e.target) && !this.optionsContainer.contains(e.target)) {
                this.optionsContainer.classList.remove('active');
            }
        });
    }
    // Function to get the input element
    getInput() {
        return this.filterInput;
    }
    // get the value of the selected elements
    getValue() {
        return this.selectedOptions;
    }

    // Function to add options to the multiFilter
    addItem(option) {
        const div = document.createElement('div');
        div.className = 'option-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'option-checkbox';
        checkbox.onclick = (e) => {
            e.stopPropagation();
            this.toggleOption(option, checkbox.checked);
        };

        const label = document.createElement('label');
        label.textContent = option;
        label.onclick = () => {
            checkbox.checked = !checkbox.checked;
            this.toggleOption(option, checkbox.checked);
        };

        div.appendChild(checkbox);
        div.appendChild(label);
        this.optionsContainer.appendChild(div);
    }
    // add Item and select it and add it to the selectedItemsContainer
    addSelectedItem(option) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.textContent = option;
        this.selectedItemsContainer.appendChild(itemDiv);
    }
    // remove Item and unselect it and remove it from the selectedItemsContainer
    removeSelectedItem(option) {
        Array.from(this.selectedItemsContainer.children).forEach(child => {
            if (child.textContent === option) {
                this.selectedItemsContainer.removeChild(child);
            }
        });
    }
    // Function to toggle the options
    toggleOptions() {
        this.optionsContainer.classList.toggle('active');
    }
    // Function to toggle the option
    toggleOption(option, isSelected) {
        if (isSelected && !this.selectedOptions.includes(option)) {
            this.selectedOptions.push(option);
            this.addSelectedItem(option);
        } else if (!isSelected) {
            this.selectedOptions = this.selectedOptions.filter(item => item !== option);
            this.removeSelectedItem(option);
        }
    }
    // Function to set the options
    addSelectedItem(option) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'selected-item';
        itemDiv.textContent = option;
        this.selectedItemsContainer.appendChild(itemDiv);
    }
    // Function to set the options
    removeSelectedItem(option) {
        Array.from(this.selectedItemsContainer.children).forEach(child => {
            if (child.textContent === option) {
                this.selectedItemsContainer.removeChild(child);
            }
        });
    }
}
