# This guesses first name and last name based on the one name field for all accounts, and saves it if it wasn't previously set
# run as cd /vagrant/reddit/r2;paster run development.ini r2/lib/migrate/names_to_firstlast.py
# or cd /home/reddit/reddit/r2;paster run production.ini r2/lib/migrate/names_to_firstlast.py


import sys
from r2.models import *

result = Account._query(Account.c.name!='')
for a in result:
    parts = a.registration_fullname.split(' ')
    if len(parts) == 1:
        #-- The fullname might have been entered as a username with underscores
        parts = a.registration_fullname.split('_')
        
    first_name = parts[0].title()
    
    if first_name == "Caseypatrickdriscoll":
        first_name = "Casey"
        last_name = "Driscoll"
    elif first_name == "Katrutt":
        first_name = "Kat"
        last_name = "Rutt"
    elif first_name == "Toddparker":
        first_name = "Todd"
        last_name = "Parker"                
    elif len(parts) > 1:
        last_name = parts[len(parts)-1].title()
    else:
        last_name = ''
    
    print "id:%s name:%s -> first:%s last:%s" % (a.name, a.registration_fullname, first_name, last_name)    
    
    if not hasattr(a,'first_name'):
        a.first_name = first_name
    if not hasattr(a,'last_name'):
        a.last_name = last_name
    a._commit()

    