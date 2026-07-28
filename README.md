# Book Finder

Search the Google Books catalogue by title, author or subject and get back
covers, authors, publishers and the year.

Live at [azevedev.github.io/BookFinder](https://azevedev.github.io/BookFinder/).

## Notes

Results are built as DOM nodes instead of concatenated HTML, so a title
carrying a quote or an angle bracket cannot break the page. Every request runs
through an `AbortController`, so typing a second search while the first is
still in flight cancels the first rather than racing it.

Google hands back cover thumbnails at whatever aspect ratio it has on file.
Each one is dropped into the same 2:3 plate so the grid stays even, and a
volume with no art at all gets a printed spine instead of a grey rectangle.

The API key in `script.js` is a browser key, which is public by nature. Restrict
it to this domain in the Google Cloud console rather than treating it as a
secret. Requests without a key go through a shared pool that is usually already
exhausted.

## Running it

Three files and one font. No build step, no dependencies:

```sh
python3 -m http.server 8000
# http://localhost:8000
```
