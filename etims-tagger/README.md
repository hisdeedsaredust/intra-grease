ETIMS Tagger
============

If you work for a particular company and have to use a Timesheet entry system
called ETIMS, then this script may be useful.

By default, works order (WO) codes have descriptions that do not include the
project that they apply to, so if you're booking to more than one project and
they both have generic descriptions like "Develop software", then it is easy
to get confused and book your time to the wrong project.

ETIMS Tagger adds new buttons to the timesheet entry form that allow you to
give names to the projects for each WO. As WO codes are of the form "A12345-39889",
where "A12345" is the project, once you have assigned a name to that project code,
all the WO codes for that project will be correctly tagged. Project names can
be changed at any time.

The tags you create are stored in Firefox's config database, which you can view
with about:config. This means that they aren't accessible from more than one
PC by default (sorry).

ETIMS Tagger also performs some small stylistic changes on the Timesheets display.
More radical reorganisations are currently planned, but they are commented out
because most people won't find them useful yet; in fact, they mostly remove all
locally styling of elements so I can see how to reorganise the page at the moment.
At some point, these changes will be split into another script called ETIMS Styler
so that people can decide which elements are useful.

