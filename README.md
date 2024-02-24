# Obsidian View Count

## About

This plugin will track the view count for each file in your vault. The count can be seen at the bottom of a note in the status bar.

By default, a _view_ is considered an opening of a file after 12 am your local time for any date. You may set the plugin to increment view count every time a file is opened in the plugin settings.

## Installation

1. Install the [Obsidian BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin from Obsidian community plugin store
2. Enable the plugin
3. Open the plugin settings
4. Click **Add beta plugin**
5. Enter the repository url: **https://github.com/trey-wallis/obsidian-view-count**
6. Click **Add plugin**

## Usage

This plugin has 2 storage options for view count: **Property** and **File**

### Property storage

If property is selected, each note will have their view count stored in a property in their frontmatter. This is helpful if you wish to visually see the view count in the frontmatter of a note.

### File storage

If file is selected, the view count for all notes will be stored in a JSON file called `view-count.json` in the Obsidian configuration directory.

## Settings

-   **Increment count once a day** - if enabled a file view count will only be incremented once a day. Otherwise, the file view count will be incremented every time it is opened.
