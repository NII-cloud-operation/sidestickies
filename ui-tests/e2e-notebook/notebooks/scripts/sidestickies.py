def get_file_browser_item_locator(page, filename):
    return page.locator(f'//*[contains(@class, "jp-DirListing-item") and contains(@title, "Name: {filename}")]')

def get_file_sticky_note_root_locator(page, filename):
    return get_file_browser_item_locator(page, filename).locator('.nbtags-widget-root')

def get_cell_sticky_note_root_locator(page, cell_index):
    cell = page.locator(f'//*[contains(@class, "jp-Cell") and @data-windowed-list-index="{cell_index}"]').nth(cell_index)
    return cell.locator('.nbtags-widget-root')

def get_current_tab_closer_locator(page):
    return page.locator('.jp-mod-current .lm-TabBar-tabCloseIcon')

async def ensure_launcher_tab_opened(page):
    # Check if Launcher tab exists, if not create one
    launcher_tab = page.locator('//*[contains(@class, "lm-TabBar-tabLabel") and text() = "Launcher"]')
    if not await launcher_tab.is_visible():
        # Click the "+" button to open a new launcher
        await page.locator('//*[@data-command="launcher:create"]').click()
    
    # Click on "Launcher" tab to make sure it's active
    await page.locator('//*[contains(@class, "lm-TabBar-tabLabel") and text() = "Launcher"]').click()

async def get_notebook_panel_ids(page):
    notebook_panels = page.locator('.jp-NotebookPanel')
    count = await notebook_panels.count()
    ids = []
    for i in range(count):
        panel = notebook_panels.nth(i)
        panel_id = await panel.get_attribute('id')
        ids.append(panel_id)
    return set(ids)

async def input_code_in_cell(page, cell_locator, content, execute=True):
    await cell_locator.click()
    await cell_locator.type(content)

    if not execute:
        return
    # Execute the cell (Shift+Enter)
    await page.keyboard.press('Shift+Enter')
    
    # Wait for cell execution to complete
    await page.wait_for_timeout(2000)

def get_file_browser_sidestickies_button_locator(page):
    return page.locator('.jp-FileBrowser').locator('//*[@data-jp-item-name="sidestickies-notebook-toggle"]')

def get_notebook_sidestickies_button_locator(page):
    return page.locator('.jp-NotebookPanel').locator('//*[@data-jp-item-name="sidestickies-comment-toggle"]')
