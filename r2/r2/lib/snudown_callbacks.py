from r2.models import Account, NotFound

# a function that returns a function.  collector is a set() that will contain all the usernames in the 
# markdown text that is parsed
def make_username_exists_callback(notify_accounts=None):
    def _(username):
        try:
            account = Account._by_name(username)
            if notify_accounts is not None:
                notify_accounts.add(account)
            return True
        except NotFound:
            account = None
            return False
    return _

username_exists = make_username_exists_callback()

def username_to_display_name(username):
    try:
        account = Account._by_name(username)
        return account.registration_fullname
    except NotFound:
        return username
