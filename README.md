# Blog

Pelican lives in the repo-root virtualenv.

```bash
source bin/activate                      # start the venv

pelican blog-input -s pelicanconf.py     # rerender blog-input/*.rst -> blog/*.html

pelican --autoreload --listen -s pelicanconf.py       # preview at http://127.0.0.1:8000/blog/ (auto-rebuilds)
```
