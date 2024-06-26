# Obsidian View Count

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22view-count%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

View count is an [Obsidian.md](https://obsidian.md) plugin for desktop and mobile. It allows you to track the view count for each file in your vault.

## Table of contents

-   [Videos](#videos)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Dataview](#dataview)
-   [API](#api)
-   [Settings](#settings)
-   [License](#license)

## Videos

Basic plugin usage

<video src="https://github.com/decaf-dev/obsidian-view-count/assets/40307803/e51fec6b-2549-4c3a-bff3-65f6d3009671" controls="controls" style="max-width: 100%;">
  Your browser does not support the video tag.
</video>

<br/>

The [sync view count to frontmatter](#sync-view-count-to-frontmatter) setting

<video src="https://github.com/decaf-dev/obsidian-view-count/assets/40307803/2e245b7d-a4f6-4e39-b115-6f0de71e7cba" controls="controls" style="max-width: 100%;">
  Your browser does not support the video tag.
</video>

<br/>

The [view count type](#view-count-type) setting

<video src="https://github.com/decaf-dev/obsidian-view-count/assets/40307803/ba3a4317-5307-40db-8bbe-75d686ae0e4f" controls="controls" style="max-width: 100%;">
  Your browser does not support the video tag.
</video>

## Installation

1. In Obsidian, open **Settings**
2. Go to **Community plugins**
3. Select **Browse**
4. Search for **View Count** by **DecafDev**
5. Select **Install**
6. Then select **Enable**

## Usage

Once you enable the plugin, view count data will start being tracked. You can see the view count on desktop in the status bar in the bottom righthand corner.

There are 2 types of view count. [View count type](#view-count-type)

If you would like to view the view count on mobile, you will need to enable the [Sync view count to frontmatter](#sync-view-count-to-frontmatter) setting.

### View count view

By default, the plugin will add a view to the sidebar called **View count**. You may access this view by opening the sidebar and clicking on the eye icon.

If the view is not open, you may run **Open view count view** from the command palette.

There are 2 different lists within the view count:

-   A list of the most viewed notes in your vault sorted in descending order. Click on the eye icon to see this list.

-   A list of the notes with the highest trending weight sorted in descending order. Click on the trending icon to see this list.

## Dataview

You may dynamically query view count data using the [Dataview plugin](https://obsidian.md/plugins?id=dataview)

### Example 1 - Query view count using Dataview

If you have **Sync view count to frontmatter** enabled you may query the view count property from the frontmatter of each markdown note.

````markdown
```dataview
TABLE view-count AS "View Count" SORT view-count DESC LIMIT 10
```
````

Let's analyze this codeblock:

1. Render a table using the [Dataview Query Language](https://blacksmithgu.github.io/obsidian-dataview/queries/structure/)
2. Query the `view-count` property in each markdown note
3. Display that property in a column called "View Count"
4. Sort the results in descending order (highest to lowest)
5. Limit the results to 10 notes

### Example 2 - Query trending notes from the last 7 days using DataviewJS

````markdown
```dataviewjs
const plugin = this.app.plugins.plugins["view-count"];
const cache = plugin.viewCountCache;

const TIME_PERIOD = "7-days";

dv.table(["Name", "Trending Weight"],
    dv.pages().sort(p => cache.getTrendingWeight(p.file, TIME_PERIOD), "desc")
        .map(p => [p.file.name, cache.getTrendingWeight(p.file, TIME_PERIOD)])
	        .slice(0,10)
);
```
````

Let's analyze this codeblock:

1. Render a table using the [DataviewJS](https://blacksmithgu.github.io/obsidian-dataview/api/intro/)
2. Display 2 columns in the table: "Name" and "Trending Weight"
3. Query all markdown files
4. Sort the files based on the trending weight in descending order (highest to lowest)
5. Format an array of data that includes object with just the file name and the trending weight
6. Limit the results to 10 notes

The time period can be updated with various values. See the [time period](#time-period) section below.

## API

The view count plugin exposes an API that can be used to fetch the view count or trending weight for any file.

To start, you need to access the view count cache.

```javascript
//Get the view count plugin
const plugin = this.app.plugins.plugins["view-count"];

//Get the view count cache
const cache = plugin.viewCountCache;
```

Then you can use the cache to get a view count or trending weight.

```javascript
//Get the trending weight
const weight = cache.getTrendingWeight(file, timePeriod);
console.log(weight);
//output: 22

//Get the view count
const viewCount = cache.getViewCount(file);
console.log(viewCount);
//output: 5
```

Here are the typescript definitions for these functions:

```javascript
getViewCount: (file: TFile) => number;
getTrendingWeight: (file: TFile, timePeriod: TimePeriod) => number;
```

### Time period

The `getTrendingWeight` function accepts a time period.

Here are the options:

| Value      | Description                           |
| ---------- | ------------------------------------- |
| `3-days`   | The last 3 days                       |
| `7-days`   | The last 7 days                       |
| `14-days`  | The last 14 days                      |
| `30-days`  | The last 30 days                      |
| `today`    | The start of the current day          |
| `week`     | The start of the week i.e. Sunday     |
| `week-iso` | The start of the iso week i.e. Monday |
| `month`    | The start of the month e.g. January 1 |

## Settings

### View count type

View count can defined 2 ways: the number of times a file has been opened or the number of unique days a file has been opened.

This option can be toggled whenever without affecting the functionality of the plugin. Both the values will be stored in the `.obsidian/view-count.json` file.

A unique day is considered an opening of a file after 12 am your local time.

### Excluded paths

The folder paths that should be excluded from view count tracking. Please separate individual paths by commas. e.g. `folder1,folder2/inner`

### Sync view count to frontmatter

For each markdown note, save the current view count to a property in its frontmatter.

This setting makes view count available on mobile. In the future, this toggling this setting will not be needed for mobile.

The view count information for all files is stored in `.obsidian/view-count.json`. This setting is optional, as it duplicates data that already exists into the frontmatter of your markdown notes.

### View count property name

The name of the property that the view will be stored in.

> [!WARNING]
> Please rename the existing view count property before updating this value. This will prevent the creation of a duplicate property. You can rename the existing property using the **rename** option in the **All Properties** view in the right sidebar.

### Templater delay

The delay in milliseconds before inserting view count frontmatter. Increase this value if you're using the Templater plugin and your template is being overwritten.

## License

View Count is distributed under [MIT License](https://github.com/decaf-dev/obsidian-view-count/blob/master/LICENSE)
