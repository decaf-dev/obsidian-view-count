# Obsidian View Count

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22view-count%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

View count is an [Obsidian.md](https://obsidian.md) plugin for desktop and mobile. It allows you to track the view count for each file in your vault.

![](/readme/property.png)

![](/readme/status-bar.png)

## About

-   [Installation](#installation)
-   [Usage](#usage)
-   [Settings](#settings)

## Installation

1. In Obsidian, open **Settings**
2. Go to **Community plugins**
3. Select **Browse**
4. Search for **View Count** by **DecafDev**
5. Select **Install**
6. Then select **Enable**

## Usage

Once you enable the plugin, view count data will start being tracked. You can see the view count on desktop in the status bar in the bottom righthand corner.

There are 2 different definitions for a view count. Please see **View count type** setting section below.

If you would like to view the view count on mobile, you will need to enable the **Sync view count to frontmatter** setting.

### View Count Pane

By default, the plugin will add a pane in the sidebar called **View Count**. You may access this pane by opening the sidebar and clicking on the eye icon. You may also open this pane by opening the command palette and running the command "Open view count pane".

There are 2 different lists within this pane. Click on the eye icon to see a list of the 50 most viewed notes sorted in descending order. Click on the trending icon to see a list of the 50 notes with the highest trending weight sorted in descending order.

![](/readme/list.png)

## Settings

**View count type** - View count can defined 2 ways: the number of times a file has been opened or the number of unique days a file has been opened.

This option can be toggled whenever without affecting the functionality of the plugin. Both the values will be stored in the `.obsidian/view-count.json` file.

A unique day is considered an opening of a file after 12 am your local time.

**Excluded paths** - The folder paths that should be excluded from view count tracking. Please separate individual paths by commas. e.g. `folder1,folder2/inner`

**Sync view count to frontmatter** - For each markdown note, save the current view count to a property in its frontmatter. This is useful if you want to query for view count using the DataView plugin.

This setting makes view count available on mobile. In the future, this setting will not be needed for mobile viewing.

The view count information for all files is stored in `.obsidian/view-count.json`. This setting is optional, as it duplicates data that already exists. However, it makes the view count more accessible for [DataView](https://github.com/blacksmithgu/obsidian-dataview) and other plugins because it makes it available in the frontmatter of each markdown note.

**View count property name** - The name of the property that the view will be stored in.

Please rename the existing property before updating this setting. You can use the rename option in the All Properties view in the sidebar to do this.

**Templater Delay** - The delay in milliseconds before inserting view count frontmatter. Increase this value if you're using the Templater plugin and your template is being overwritten.
