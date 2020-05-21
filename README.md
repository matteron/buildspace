# Buildspace

Buildspace is a tiny tool meant to replace all the boilerplate code I keep writing to build my static sites.

It's not necessarily a a static site generator, but a small component to help build static site generators.  It's extremely simple in functionality, it can effectively just pass data into templates and copy files.

Buildspace was made for myself first, it's probably doing a bunch of stuff incorrectly, but this isn't meant for mass consumption, so oh well.

## Basic Usage
Install with npm.

`npm i buildspace`

Then some basic boilerplating (sorry can't get rid of all of it)
```JavaScript
const BuildSpace = require('buildspace');
const Template = require('./src/template');
const Page = require('./src/pages');

const bs = new BuildSpace();
bs.register(Page, Template);
bs.build();
```

### To explain:

You create a new instance of Buildspace, register pages to it, along with the Template it will use.  Then you simply tell buildspace to run using `.build()`.

Templates are very basic classes, all they are required to have is a function called `build` which optionally takes in data of some kind and outputs a string.

```JavaScript
// Basic Template Example
module.exports = class Template {
	build = (data) => '';
}
```

Pages are a bit more complicated, but are also simple classes.  They are required to have the properties `path` and `data`.  Path is the relative path where buildspace will store the compiled html file and data is the data the page provides the template.

```JavaScript
// Basic Page Example
module.exports = class Page {
	path = 'index';
	data = {
		hello: 'world'
	};
}
```

## [Slightly More] Advanced Setup

### Advanced Functions
Since the intent of any library is to minimize code reuse, I've added a few functions to aid in that.

#### `.setDefaultTemplate(TemplateConstructor)`
This function takes a template class and sets buildspace to auto assign it to any page registration without a template specified.

#### `.bulkRegister(pageArray)`
The function will loop through the provided page array and register all of them using the default template.

#### `.addPreprocessor(callback)` and `addPostprocessor(callback)`
These two functions will setup buildspace to run the callbacks before and after the main build process runs respectively.  They will pass the current instance of buildspace to the callback function so you can use any of it's properties.

### Options

Buildspace also has a few options that can be passed into it's constructor to modify its behavior.

```JavaScript
const bs = new Buildspace({
	inputDir: 'src',
	outputDir: 'out',
	copyDirs: ['media']
});
```

#### `source`
`Default: src`
Input Directory where the source code of your site lives.  This isn't actually used for anything besides in conjunction with the copy directories property by default.

#### `output`
`Default: out`
Output directory where buildspace will write all of its output to.

#### `copy`
`Default: []`
Copy directories is an array of strings which list all the directories which you would like buildspace to copy to the output without any further modification.  I typically add things like my fonts or css files to this list.

## Changelog

`0.1.2`
- Stopped using .npmignore

`0.1.1`:
- Fixed issue where copying would fail when it reached subdirectories.
- Simplified named of the option parameters. 