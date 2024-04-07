# Obsidian View Count

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22view-count%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

View count is an [Obsidian.md](https://obsidian.md) plugin for desktop and mobile. It allows you to track the view count for each file in your vault.

The view count can be seen as a property in the note's frontmatter or at the bottom of the note in the status bar.

![](/readme/property-storage.gif)

![](/readme/file-storage.gif)

## About

-   [Installation](#installation)
-   [Usage](#usage)
-   [Settings](#settings)

## Installation

1. In Obsidian, open **Settings**
2. Go to **Community plugins**
3. Select **Browse**
4. Search for **View Count** by Trey Wallis
5. Select **Install**
6. Then select **Enable**

## Usage

By default the plugin will save view count in a property called `view-count` in each file that is opened. The view count will be incremented once a day. To change these settings, please view the **Settings** section below.

### Most viewed notes

To see a list of the 50 most viewed notes, open the sidebar and click on the eye icon

![](/readme/list.png)

## Settings

This plugin has 2 storage options for view count: **Property** and **File**. Please restart Obsidian after changing this setting.

**Property storage** - If property is selected, each note will have their view count stored in a property in their frontmatter.

| Pros                                                 | Cons                                                     |
| ---------------------------------------------------- | -------------------------------------------------------- |
| View count is a part of the frontmatter of each note | Only markdown files can have their views tracked         |
| View count can be see on mobile                      | Each time a view count is updated, your file is modified |

**File storage** - If file is selected, the view count for all notes will be stored in a JSON file called `view-count.json` in the Obsidian config directory (by default `.obsidian`). The view count will then appear in the status bar at the bottom of each note.

| Pros                                             | Cons                                |
| ------------------------------------------------ | ----------------------------------- |
| View count is tracked for all files              | View count is unavailable on mobile |
| View count is stored in one individual JSON file |                                     |

**Increment once a day** - if enabled a view count will increment once a day. _Once a day_ means opening a file after 12 am local time for any given date. If disabled, the view count will increment every time the file is opened.

When increment once a day is enabled and the property type is set to storage, a `view-date` property will be added to your note.
