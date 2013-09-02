// ==UserScript==
// @name          ETIMS Tagger
// @namespace     http://hisdeedsaredust.com/
// @description   Tag project codes on ETIMS for memorability
// @version       1.1.0
// @grant         GM_getValue
// @grant         GM_setValue
// @require       http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @include       http://etims/*
// @include       http://etims.rdn.thales.co.uk/*
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
'.projtag { color: #880; font-weight: bolder; cursor: pointer }' +
'table { border-collapse: collapse }'
);

// I get tired of typing out the whole thing
function xpath_snapshot(expr, root) {
    return document.evaluate(expr, root, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

// Event listener for span.projtag to allow retagging
// this is SPAN.projtag, this.parentNode is the containing TD
function evlRetag() {
    var prevfield = this.parentNode.previousSibling.firstChild;
    var projname = prevfield.value.match(/^(\w+)-/)[1];
    var projtag = prompt("Tag for " + projname, this.innerHTML);
    if (projtag) {
        GM_setValue(projname, projtag);
        this.innerHTML = projtag;
        addTags();
    }
    return false;
}

// Event listener for tag button
// this is the button, this.parentNode is the containing TD
function evlTag() {
    var prevfield = this.parentNode.previousSibling.firstChild; // the previous cell's input field
    var projname = prevfield.value.match(/^(\w+)-/)[1];
    var projtag = prompt("Tag for " + projname);
    if (projtag) {
        GM_setValue(projname, projtag);
        var newele = document.createElement("span");
        newele.setAttribute("class", "projtag");
        newele.innerHTML = projtag;
        newele.addEventListener("click", evlRetag, false);
        this.parentNode.replaceChild(newele, this);
        addTags();
    }
    return false;
}

function addTag( nextcell, projtag )
{
    // Have we tagged this already, or put in a button to allow tagging?
    if (nextcell.firstChild.nodeName == "SPAN") {
        // There _should_ already be a project tag, because we don't offer a way of deleting them yet
        if (projtag)
            nextcell.firstChild.innerHTML = projtag;
    } else if (nextcell.firstChild.nodeName == "INPUT") {
        // got a "tag" button, so may have to replace this with tag
        if (projtag) {
            // OK, this must be been tagged since we last looked, so replace INPUT with SPAN
            var newele = document.createElement("span");
            newele.setAttribute("class", "projtag");
            newele.innerHTML = projtag;
            newele.addEventListener("click", evlRetag, false);
            nextcell.replaceChild(newele, nextcell.firstChild);
        }
    } else {
        // First time through (page load). Need to space the existing description from the tag or button
        // we're about to create.
        nextcell.innerHTML = ' ' + nextcell.innerHTML;
        var newele;
        if (projtag) {
            newele = document.createElement("span");
            newele.setAttribute("class", "projtag");
            newele.innerHTML = projtag;
            newele.addEventListener("click", evlRetag, false);
        } else  {
            newele = document.createElement("input");
            newele.type = "button";
            newele.value = "tag";
            newele.addEventListener("click", evlTag, false);
        }
        nextcell.insertBefore(newele, nextcell.firstChild);
    }
}

function addTags() {
    var r = new RegExp("^todo_tsh_idx_(\\d+)$");
    var e = document.getElementsByTagName("input");
    for (var i = 0; i < e.length; ++i) {
        // Unstyle all buttons by removing the class that makes them blue
        // (can't just restyle them, but that won't restore rounded shape)
        if (e[i].className == "bbl") { e[i].removeAttribute("class"); }
        if (r.test(e[i].getAttribute('name'))) {
            // WO Entry boxes are too small nowadays
            if (e[i].getAttribute('size') == "15") {
                e[i].setAttribute('size', '20');
            }

            if (e[i].getAttribute('name').match(r)[1] > 0) { // [1] is number at end
                var ev = e[i].getAttribute('value');
                var firstbit = ev.match(/^(\w+)-/);
                if (firstbit) {
                    var projtag = GM_getValue(firstbit[1]);
                    var nextcell = e[i].parentNode.nextSibling;
                    addTag( nextcell, projtag );
                }
            }
        }
    }
}

function removeTE05() {
    var mdiv = xpath_snapshot('//div[@class="err"]', document);
    for (var i = 0; i < mdiv.snapshotLength; ++i) {
        var thisdiv = mdiv.snapshotItem(i);
        if (thisdiv.textContent == "TE05")
            thisdiv.parentNode.removeChild(thisdiv);
    }
}

addTags();
removeTE05();
//stripOldStyles();

var e = document.forms.namedItem('loginform');
if (e) {
    var sel = e.elements.namedItem('todo_tsh_idx__0');
    if (sel) {
        var sn = sel.childNodes;
        for (var j = 0; j < sn.length; ++j) {
            if (sn[j].nodeName == 'OPTION') {
                var firstbit = sn[j].value.match(/^(\w+)-/);
                if (firstbit) {
                    var projcode = firstbit[1];
                    var projname = GM_getValue(projcode);
                    if (projname) {
                        var packagelabel = sn[j].text.match(/^(\w+-\w+) (.*)$/);
                        if (packagelabel) {
                            sn[j].text = packagelabel[1] + ' ' + projname + ' ' + packagelabel[2];
                        }
                    }
                }
            }
        }
    }
}

// Advertise presence of the Tagger
var hdr = xpath_snapshot('//tr[@class="hdr"]/td', document);
for (var i = 0; i < hdr.snapshotLength; ++i) {
    var thistd = hdr.snapshotItem(i);
    //alert(thistd.textContent.substring(0,5));
    if (thistd.textContent.substring(0,5) == "TIMeS") {
        thistd.textContent = "TIMeS+Tagger" + thistd.textContent.substring(5);
    }
}

// Allow me to quickly load new versions
//var snap = xpath_snapshot('/html/body/form/table[2]/tbody/tr/td[3]', document);
//snap.snapshotItem(0).innerHTML = '<a href="http://localhost/etims_tagger.user.js">Reload Tagger</a>';

// Use proper arrows on buttons
var butsnap = xpath_snapshot("//input[@type='SUBMIT']", document);
for (var i = 0; i < butsnap.snapshotLength; ++i) {
    var thisinp = butsnap.snapshotItem(i);
    if (thisinp.value == "->") { thisinp.value = "\u25ba"; }
    if (thisinp.value == "<-") { thisinp.value = "\u25c4"; }
}

function stripOldStyles() {
    var e = document.getElementsByTagName("body");
    e[0].removeAttribute("bgcolor");
    e[0].removeAttribute("text");
    e[0].removeAttribute("link");
    e[0].removeAttribute("vlink");
    e[0].removeAttribute("alink");
    var e = document.getElementsByTagName("table");
    for (var i = 0; i < e.length; ++i) {
        e[i].removeAttribute("cellspacing");
        e[i].removeAttribute("cellpadding");
        e[i].removeAttribute("border");
        e[i].removeAttribute("bgcolor");
    }

    var pagenumber = 0;
    var pagesnap = xpath_snapshot("//input[@name='times_Ppage_no']/attribute::value", document);
    if (pagesnap.snapshotLength > 0) { pagenumber = parseInt(pagesnap.snapshotItem(0).value, 10); }

    if (pagenumber == 151) {
        // Correct the alignment of the new entry fields
        var snap = xpath_snapshot("/html/body/form/div/table[3]/tbody/tr[4]", document);
        var row = snap.snapshotItem(0);
        var newrow = document.createElement("tr");
        newrow.innerHTML = "<td>" + row.cells[0].firstChild.nodeValue + "</td><td>" + row.cells[1].firstChild.nodeValue + "</td>";
        row.parentNode.insertBefore(newrow, row);
        row.cells[0].removeChild(row.cells[0].firstChild); // old "Enter"
        row.cells[0].removeChild(row.cells[0].firstChild); //             and following <br>
        row.cells[1].removeChild(row.cells[1].firstChild); // old "or Off Book/reuse"
        row.cells[1].removeChild(row.cells[1].firstChild); //             ditto
        var tdsnap = xpath_snapshot("/html/body/form/div/table[3]/tbody/tr/*[last()>=9][position()>last()-8][position()<last()]", document);
        for (var i = 0; i < tdsnap.snapshotLength; ++i) {
            e = tdsnap.snapshotItem(i);
            e.setAttribute("style", "min-width:4em;border: 1px solid green!important");
            //alert(e.childElementCount);
            if (e.childElementCount > 0 && e.childNodes[0].nodeName=="INPUT") {
                e.childNodes[0].setAttribute("size", "2");
                e.childNodes[0].setAttribute("style", "width: 100%");
            }
        }
    }

    // Identify drop downs that shouldn't be there (only one choice)
    // For ordinary users, this will replace the Username and Department drop-downs with plain text
    var optsnap = xpath_snapshot("//select/option[last()=1]", document);
    //if (optsnap.snapshotLength > 0) { alert("got opt of length" + optsnap.snapshotLength); }
    for (var i = 0; i < optsnap.snapshotLength; ++i) {
        var e_option = optsnap.snapshotItem(i);
        var e_select = e_option.parentNode; // we'll replace this with text
        e_select.parentNode.replaceChild(document.createTextNode(e_option.textContent), e_select);
    }
}


// http://stackoverflow.com/questions/8281441/fire-greasemonkey-script-on-ajax-request/8283815#8283815
/*--- waitForKeyElements():  A handy, utility function that
    does what it says.
*/
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Required: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    bNoFlag,        /* Optional: If true, will match same items
                        again with each call.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
)
{
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes     = $(selectorTxt);
    else
        targetNodes     = $(iframeSelector).contents ()
                                           .find (selectorTxt);

    if (targetNodes  &&  targetNodes.length > 0) {
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each ( function () {
            var jThis        = $(this);
            var alreadyFound = jThis.data ('alreadyFound')  ||  false;

            if (!alreadyFound) {
                //--- Call the payload function.
                actionFunction (jThis);
                if (!bNoFlag)
                    jThis.data ('alreadyFound', true);
            }
        } );
        btargetsFound   = true;
    }
    else {
        btargetsFound   = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj      = waitForKeyElements.controlObj  ||  {};
    var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
    var timeControl     = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval (timeControl);
        delete controlObj [controlKey]
    }
    else if (!btargetsFound || !bWaitOnce) {
        //--- Set a timer, if needed.
        if ( ! timeControl) {
            timeControl = setInterval ( function () {
                    waitForKeyElements (    selectorTxt,
                                            actionFunction,
                                            bWaitOnce,
                                            bFlag,
                                            iframeSelector
                                        );
                },
                500
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj   = controlObj;
}


function addAdditionalHoursTags() {
    $("input[name^='actual_hours_']").each( function(idx) {
        var this_td = $(this).closest("td");
        var name_td = this_td.prev();
        var code_td = name_td.prev();
        if (!code_td.length)  return;
        var code_tx = code_td.text();
        var firstbit = code_tx.match(/^\s*(\w+)-/);
        var projtag = GM_getValue(firstbit[1]);
        var nextcell = name_td.get(0);

        // Same as addTags()
        addTag( nextcell, projtag );
    });
}


// Fix broken off-booking dropdown
function waitForAHOB()
{
    waitForKeyElements( "#_additionalHoursTab", fixAHOB, true, true );
}

// Function to patch up the broken select option once it's loaded
function fixAHOB(jNode)
{
    // Look for text to be fixed
    if (jNode.html().search('<option>-- Please Select --</option>') != -1)
    {
        // Fix it
        jNode.html( jNode.html().replace('<option>-- Please Select --</option>','<option value="">-- Please Select --</option>') );

        // Fix up tagged bookings
        addAdditionalHoursTags();

        // Make the submit buttons trigger the fix-up routine again
        var submitButtons = $("input[value='Submit Additional Hours'],input[value='Resubmit Additional Hours']");
        submitButtons.bind( "click", waitForAHOB );

        // Disable Return on input fields, as the page then doesn't work!
        inputFields = $("input[name='actual_code'],input[name^='actual_hours']");
        inputFields.bind( "keypress", function(e) {
            // Prepare to do a fix upon Enter
            var k = e.keyCode || e.which;
            return (k != 13);
        } );
    }
    else
    {
        // Not there to fix (or already fixed?  But then see recheck in submit code just above)
        // Create one shot timer to make it look again
        setTimeout( waitForAHOB, 500 );
    }
}

// Make the additional hours tab 'link' trigger the fix-up routine
var additionalHours = $("div.additionalHoursTabHeading a");
additionalHours.bind( "click", function() {
    // Blow away old additional hours content so we don't confuse it with incoming new content
    document.getElementById('_additionalHoursTab').innerHTML = "[unloaded]";
    waitForAHOB();
});

// ChangeLog
// 2013-09-02 fnx Additional hours tab work
// 2012-10-03 flo Make WO Entry boxes larger. Advertise Tagger.
// 2007-08-03 flo Remove TE05 because they aren't real errors
// 2007-08-02 flo multiple cost codes for same project will be tagged correctly in one go
// 2007-08-02 flo factored out event listener so tags are live straight away on first tagging
// 2007-08-01 flo Tags can be retagged by clicking on them
// 2007-07-25 flo Populate work package drop-down list with tags
// 2007-07-25 flo First version
//
// Faults/To do
// - drop-down list of project codes isn't affected by tagging or re-tagging. Needs page reload because we have
//   no way of knowing which part is an old tag (to be replaced) and which part is the proper description
