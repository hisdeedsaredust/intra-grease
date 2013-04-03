// ==UserScript==
// @name          HR Readability
// @namespace     http://hisdeedsaredust.com/
// @description   Change style on HR's myselfservice tool
// @version       1.0.0
// @include       https://selfservice.tisuk.thales/*
// ==/UserScript==

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

addGlobalStyle(
//'body { font-size: 100% ! important }' +
'td { font-size: inherit ! important }' +
'font { font-size: inherit ! important }' +
'.headerright { float: right ! important; background-color: white; padding-left:100px ! important }'
);

// Remove scary hypnotising picture
var imggrp = document.evaluate('//img[@src]', document, null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
for (var i = 0; i < imggrp.snapshotLength; ++i) {
    var e = imggrp.snapshotItem(i);
    if (e.src == 'https://selfservice.tisuk.thales/images/homepage_photo2.jpg') {
        e.src = '';
    }
}
