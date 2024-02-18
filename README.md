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
7. Navigate to the community plugins list
8. Enable **View Count**

## Usage

Install the plugin and files will automatically have their view count tracked.

View count is stored in `.obsidian/view-count.json`. This allows you to uninstall and install the plugin again without losing any data. In addition, this view count is stored in a friendly JSON format that may be parsed by other applications.

### Settings

-   **Increment count once a day** - when enabled a file view count will only be incremented once a day. Otherwise, the file view count will be incremented every time it is opened.
