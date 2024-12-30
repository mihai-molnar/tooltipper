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
            
            // Enable view mode only if it's explicitly a shared URL
            if (data.shared && window.location.href !== window.location.origin + window.location.pathname) {
                document.body.classList.add('view-mode')
                isViewMode = true
            } else {
                // Ensure we're in edit mode
                document.body.classList.remove('view-mode')
                isViewMode = false
            }
            
            // Enable share button since we have an image
            shareBtn.disabled = false
            
            updateGrid()
            
            // Add has-tooltip class to items after grid is updated
            setTimeout(() => {
                tooltips.forEach(tt => {
                    const item = document.querySelector(`[data-value="${tt.id}"]`)
                    if (item) {
                        item.classList.add('has-tooltip')
                    }
                })
            }, 0)
            
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
            // Add has-tooltip class
            const item = document.querySelector(`[data-value="${tt.id}"]`)
            if (item) {
                item.classList.add('has-tooltip')
            }
            updateShareableUrl(false)
            shareBtn.disabled = false
        }
        input.remove()
        isInputOpened = false
    })
    
    deleteBtn.addEventListener('click', () => {
        const index = tooltips.findIndex(t => t.id === tt.id)
        if (index !== -1) {
            tooltips.splice(index, 1)  // Remove the tooltip at the found index
        }
        // Remove has-tooltip class
        const item = document.querySelector(`[data-value="${tt.id}"]`)
        if (item) {
            item.classList.remove('has-tooltip')
        }
        updateShareableUrl(false)
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
function updateShareableUrl(forSharing = false) {
    // Always update share button state based on image presence
    shareBtn.disabled = !grid.style.backgroundImage;
    
    if (!grid.style.backgroundImage) {
        return;
    }

    const data = {
        image: grid.style.backgroundImage.slice(5, -2), // Remove url() wrapper
        tooltips: tooltips,
        gridSize: parseInt(gridSizeInput.value)
    }

    // Only add shared flag when actually sharing
    if (forSharing) {
        data.shared = true
    }

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(data))
    
    // Don't update hash when sharing (prevents view mode on refresh)
    if (!forSharing) {
        window.location.hash = compressed
    }
    
    return compressed
}

// Add this new function
async function shortenUrl(longUrl) {
    try {
        // Using is.gd API (no API key required)
        const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`)
        const data = await response.json()
        if (data.shorturl) {
            return data.shorturl
        }
        throw new Error('Failed to get shortened URL')
    } catch (error) {
        console.error('Error shortening URL:', error)
        // Return original URL if shortening fails
        return longUrl
    }
}

// Handle share button click
shareBtn.addEventListener('click', async () => {
    const hash = updateShareableUrl(true)
    const longUrl = `${window.location.origin}${window.location.pathname}#${hash}`
    
    // Show loading state
    shareBtn.disabled = true
    shareBtn.textContent = 'Generating...'
    
    try {
        const shortUrl = await shortenUrl(longUrl)
        await navigator.clipboard.writeText(shortUrl)
        showToast('Short URL copied to clipboard!')
    } catch (error) {
        console.error('Error sharing:', error)
        await navigator.clipboard.writeText(longUrl)
        showToast('URL copied to clipboard! (Shortening failed)')
    } finally {
        // Restore button state
        shareBtn.disabled = false
        shareBtn.textContent = 'Share'
    }
})

// Update the toast to allow for longer display times
function showToast(message, duration = 2000) {  // Increased duration to 2 seconds
    const toast = document.getElementById('toast')
    toast.textContent = message
    toast.classList.add('show')
    
    setTimeout(() => {
        toast.classList.remove('show')
    }, duration)
}

// Handle file upload
uploadBtn.addEventListener('click', () => {
    const file = imageUpload.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
        // Clear view mode
        document.body.classList.remove('view-mode')
        isViewMode = false
        
        grid.style.backgroundImage = `url(${e.target.result})`
        tooltips.length = 0 // Clear existing tooltips
        updateShareableUrl(false) // Explicitly not sharing
        updateGrid()
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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize from hash if present
    if (!initFromHash()) {
        updateGrid()
    }
    
    // Set initial share button state
    shareBtn.disabled = !grid.style.backgroundImage
})
