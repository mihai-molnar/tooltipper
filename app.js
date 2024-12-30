const grid = document.getElementById('grid')
const uploadBtn = document.getElementById('uploadBtn')
const imageUpload = document.getElementById('imageUpload')
const gridSizeInput = document.getElementById('gridSize')
const tooltips = []
let isInputOpened = false

function updateGrid() {
    const size = Math.max(5, parseInt(gridSizeInput.value) || 10)
    gridSizeInput.value = size // Update input in case value was below minimum
    
    // Get grid dimensions
    const gridWidth = grid.offsetWidth
    const gridHeight = grid.offsetHeight
    
    // Calculate number of items needed
    const cols = Math.ceil(gridWidth / size)
    const rows = Math.ceil(gridHeight / size)
    const totalItems = cols * rows
    
    // Update grid styles
    grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`
    grid.style.gridTemplateRows = `repeat(${rows}, ${size}px)`
    
    // Clear existing grid items
    grid.innerHTML = ''
    
    // Add new grid items
    addGridItems(totalItems)
}

function addGridItems(num) {
    for (let i = 0; i < num; i++) {
        const item = document.createElement('div')
        item.className = 'item'
        item.setAttribute('data-value', i)
        grid.appendChild(item)
        item.addEventListener('click', (e) => {
            handleClick(e)
        })
        item.addEventListener('mouseover', (e) => {
            handleMouseHover(e)
        })
        item.addEventListener('mouseout', (e) => {
            const tooltip = document.querySelector('.tooltip')
            if (tooltip) tooltip.remove()
        })
    }
}

function handleClick(e) {
    if (isInputOpened) return
    const id = e.target.getAttribute('data-value')
    const existingTooltip = tooltips.find(t => t.id === id)
    const tt = existingTooltip || {id, message: ''}
    openInput(e.target, tt)
    isInputOpened = true
}

function openInput(target, tt) {
    const input = document.createElement('div')
    input.className = 'tooltip-input'
    
    const textInput = document.createElement('input')
    textInput.type = 'text'
    textInput.value = tt.message
    textInput.placeholder = 'Enter tooltip text'
    
    const saveBtn = document.createElement('button')
    saveBtn.className = 'save-btn'
    saveBtn.textContent = 'Save'
    
    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'delete-btn'
    deleteBtn.textContent = 'Delete'
    deleteBtn.style.display = tt.message ? 'block' : 'none' // Only show delete for existing tooltips
    
    input.appendChild(textInput)
    input.appendChild(saveBtn)
    input.appendChild(deleteBtn)
    document.body.appendChild(input)
    
    // Position the input near the grid item
    const rect = target.getBoundingClientRect()
    input.style.top = `${rect.bottom + window.scrollY + 10}px`
    input.style.left = `${rect.left + window.scrollX}px`
    
    textInput.focus()
    
    saveBtn.addEventListener('click', () => {
        const message = textInput.value.trim()
        if (message) {
            const existingIndex = tooltips.findIndex(t => t.id === tt.id)
            if (existingIndex >= 0) {
                tooltips[existingIndex].message = message
            } else {
                tooltips.push({ id: tt.id, message })
            }
        }
        input.remove()
        isInputOpened = false
    })
    
    deleteBtn.addEventListener('click', () => {
        const index = tooltips.findIndex(t => t.id === tt.id)
        if (index >= 0) {
            tooltips.splice(index, 1)
        }
        input.remove()
        isInputOpened = false
    })
    
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click()
        } else if (e.key === 'Escape') {
            input.remove()
            isInputOpened = false
        }
    })
}

function handleMouseHover(e) {
    const id = e.target.getAttribute('data-value')
    const tt = tooltips.find(t => t.id === id)
    if (!tt) return
    
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.innerHTML = tt.message
    document.body.appendChild(tooltip)
    
    const rect = e.target.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    
    // Check if there's enough space above
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const margin = 10 // pixels of margin between tooltip and grid item
    
    let top, position
    
    if (spaceAbove >= tooltipRect.height + margin || spaceAbove > spaceBelow) {
        // Position above if there's enough space or more space than below
        top = rect.top - tooltipRect.height - margin + window.scrollY
        position = 'top'
    } else {
        // Position below
        top = rect.bottom + margin + window.scrollY
        position = 'bottom'
    }
    
    const left = rect.left + (rect.width - tooltipRect.width) / 2 + window.scrollX
    
    tooltip.classList.add(position)
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`
}

// Handle grid size changes
gridSizeInput.addEventListener('input', updateGrid)

// Handle image upload
uploadBtn.addEventListener('click', () => {
    const file = imageUpload.files[0]
    if (!file) {
        alert('Please select an image first')
        return
    }
    
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
    }
    
    const reader = new FileReader()
    reader.onload = (e) => {
        grid.style.backgroundImage = `url(${e.target.result})`
        // Clear the file input for next use
        imageUpload.value = ''
    }
    reader.readAsDataURL(file)
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        let inputs = document.querySelectorAll('.tooltip-input')
        if (!inputs) return
        inputs.forEach((input) => {
            input.remove()
        })
        isInputOpened = false
    } 
})

// Initialize grid
updateGrid()
