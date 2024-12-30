const grid = document.getElementById('grid')
const uploadBtn = document.getElementById('uploadBtn')
const imageUpload = document.getElementById('imageUpload')
const gridSizeInput = document.getElementById('gridSize')
const shareBtn = document.getElementById('shareBtn')
const tooltips = []
let isInputOpened = false
let isViewMode = false

// Check if we're loading from a hash
function initFromHash() {
    const hash = window.location.hash.slice(1) // Remove the # symbol
    if (!hash) return false

    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(hash)
        const data = JSON.parse(decompressed)
        if (data.image && data.tooltips) {
            grid.style.backgroundImage = `url(${data.image})`
            tooltips.push(...data.tooltips)
            gridSizeInput.value = data.gridSize || 10
            
            // Hide controls in view mode
            document.body.classList.add('view-mode')
            isViewMode = true
            
            updateGrid()
            return true
        }
    } catch (error) {
        console.error('Error loading from hash:', error)
    }
    return false
}

function updateGrid() {
    const defaultSize = 10
    const size = Math.max(5, parseInt(gridSizeInput.value) || defaultSize)
    gridSizeInput.value = size
    
    // Get grid dimensions
    const gridWidth = Math.max(grid.offsetWidth, 600)
    const gridHeight = Math.max(grid.offsetHeight, 400)
    
    // Calculate number of items needed based on default size
    const cols = Math.floor(gridWidth / size)
    const rows = Math.floor(gridHeight / size)
    const totalItems = cols * rows
    
    // Update grid styles
    grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`
    grid.style.gridTemplateRows = `repeat(${rows}, ${size}px)`
    grid.style.width = `${cols * size}px`
    grid.style.height = `${rows * size}px`
    
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
        
        // Only add click listener if not in view mode
        if (!isViewMode) {
            item.addEventListener('click', (e) => {
                handleClick(e)
            })
        }
        
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
    if (isInputOpened || isViewMode) return
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
            updateShareableUrl()
        }
        input.remove()
        isInputOpened = false
    })
    
    deleteBtn.addEventListener('click', () => {
        const index = tooltips.findIndex(t => t.id === tt.id)
        if (index >= 0) {
            tooltips.splice(index, 1)
            updateShareableUrl()
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

// Create and update shareable URL
function updateShareableUrl() {
    if (!grid.style.backgroundImage) {
        shareBtn.disabled = true
        return
    }
    
    const data = {
        image: grid.style.backgroundImage.slice(5, -2), // Remove url() wrapper
        tooltips: tooltips,
        gridSize: parseInt(gridSizeInput.value)
    }
    
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))
    window.location.hash = compressed
    shareBtn.disabled = false
}

// Handle share button click
shareBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(window.location.href)
        const originalText = shareBtn.textContent
        shareBtn.textContent = 'Copied!'
        setTimeout(() => {
            shareBtn.textContent = originalText
        }, 2000)
    } catch (err) {
        console.error('Failed to copy URL:', err)
        alert('Failed to copy URL to clipboard. Please copy it manually from the address bar.')
    }
})

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
        tooltips.length = 0 // Clear existing tooltips
        updateShareableUrl()
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

// Handle grid size changes
gridSizeInput.addEventListener('input', () => {
    updateGrid()
    updateShareableUrl()
})

// Initialize
if (!initFromHash()) {
    updateGrid()
}
