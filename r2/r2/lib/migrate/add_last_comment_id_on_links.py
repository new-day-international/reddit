# populate last_comment_id on all links
# run with paster run run.ini r2/lib/migrate/add_last_comment_id_on_links.py -c 'add_last_comment_id_on_links()'

from r2.models import *
from r2.lib.utils import fetch_things2, flatten

def add_last_comment_id_on_links():
    links = Link._query(data=True)
    links._sort = asc('_date')
    links = list(fetch_things2(links))
    for link in links:
        comments = Comment._query(Comment.c.link_id==link._id)
        comments._sort = desc('_date')
        comments = list(fetch_things2(comments))
        if comments:        
            link.last_comment_id = comments[0]._id
            link._commit()