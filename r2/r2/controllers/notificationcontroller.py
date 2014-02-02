# The contents of this file are subject to the Common Public Attribution
# License Version 1.0. (the "License"); you may not use this file except in
# compliance with the License. You may obtain a copy of the License at
# http://code.reddit.com/LICENSE. The License is based on the Mozilla Public
# License Version 1.1, but Sections 14 and 15 have been added to cover use of
# software over a computer network and provide for limited attribution for the
# Original Developer. In addition, Exhibit A has been modified to be consistent
# with Exhibit B.
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
# the specific language governing rights and limitations under the License.
#
# The Original Code is reddit.
#
# The Original Developer is the Initial Developer.  The Initial Developer of
# the Original Code is reddit Inc.
#
# All portions of the code written by reddit are Copyright (c) 2006-2013 reddit
# Inc. All Rights Reserved.
###############################################################################

from oauth2 import require_oauth2_scope

from r2.models import *
from r2.controllers.listingcontroller import ListingController, listing_api_doc
from r2.lib.pages import NotificationPage, plurals
from r2.lib.validator import *
from r2.controllers.api_docs import api_doc, api_section
from r2.config.extensions import is_api
from r2.lib.db import queries

from pylons.i18n import _

from r2.lib.menus import NavButton, NavMenu

class NotificationController(ListingController):

    show_nums = False
    render_cls = NotificationPage
    allow_stylesheets = False

    # note: this intentionally replaces the listing-page class which doesn't
    # conceptually fit for styling these pages.
    extra_page_classes = ['notification-page']

    @property
    def show_sidebar(self):
        return False

    @property
    def menus(self):
        return []

    def title(self):
        return _('notification') + ': ' + _(self.where)

    def keep_fn(self):
        def keep(item):
            wouldkeep = item.keep_item(item)

            # TODO: Consider a flag to disable this (and see above plus builder.py)
            if (item._deleted or item._spam) and not c.user_is_admin:
                return False

            # If the author is an enemy, ignore their notifications...
            if item.author_id in c.user.enemies:
                return False

            # don't show user their own unread stuff
            if (self.where == 'inbox') and (item.author_id == c.user._id or not item.new):
                return False

            return wouldkeep
        return keep

    # NOTE: The following routines are called via ListingController.GET_listing
    #
    #   self.query_obj = self.query()
    #   self.builder_obj = self.builder()
    #   self.listing_obj = self.listing()
    #
    # There is also this line:
    #   content = self.content()
    #
    # which in ListingController.content() just returns:
    #
    #   return self.listing_obj
    #
    # So, by overriding query(), builder(), and listing() you can use the
    # default ListingController.GET_listing to implement the listing.

    def query(self):
        g.log.info("NotificationController.query() - where: %s", self.where)

        if self.where == 'inbox':
            q = queries.get_unread_notifications(c.user)

        elif self.where == 'sent':
            q = queries.get_sent_notifications(c.user)

        elif self.where == 'notifications':
            q = queries.get_notifications(c.user)

        elif self.where == 'reset_message_counts':
            g.log.debug("resetting message count")
            c.user.message_count = 2
            c.user.moderator_message_count = 1
            c.user.notification_count = 7
            c.user._commit()

            q = queries.get_notifications(c.user)
        else:
            return self.abort404()

        # Clear the message count under most circumstances...
        if self.where not in ('sent', 'reset_message_counts'):
            if self.mark != 'false':
                c.user.clear_message_count()

        return q

    def builder(self):
        root = c.user

        parent = None
        skip = False
        if self.message:
            if self.message.first_message:
                parent = Message._byID(self.message.first_message,
                                       data=True)
            else:
                parent = self.message
        elif c.user.pref_threaded_messages:
            skip = (c.render_style == "html")

        return UserMessageBuilder(root,
                                  wrap = self.builder_wrapper,
                                  parent = parent,
                                  skip = skip,
                                  num = self.num,
                                  after = self.after,
                                  keep_fn = self.keep_fn(),
                                  reverse = self.reverse)

    def listing(self):

        if (self.where in ('inbox', 'sent', 'notifications')):
            return Listing(self.builder_obj).listing()

        pane = ListingController.listing(self)

        # Indicate that the comment tree wasn't built for comments
        for i in pane.things:
            if i.was_comment:
                i.child = None

        return pane

    @require_oauth2_scope("privatemessages")
    @validate(VUser(),
              message = VMessageID('mid'),
              mark = VOneOf('mark',('true','false')))
    @listing_api_doc(section=api_section.notifications,
                     uri='/notification/{where}',
                     uri_variants=['/notification/inbox', '/notification/sent', '/notification/notifications'])
    def GET_listing(self, where, mark, message, subwhere = None, **env):

        import sys

        if not c.default_sr:
            print "Aborting with 403"
            sys.stdout.flush()

            abort(403, "forbidden")

        self.where = where
        self.subwhere = subwhere

        if mark is not None:
            self.mark = mark
        elif is_api():
            self.mark = 'false'
        elif c.render_style and c.render_style == "xml":
            self.mark = 'false'
        else:
            self.mark = 'true'

        self.message = message

        print "GET_listing: where = %s, subwhere = %s" % (where, subwhere)
        sys.stdout.flush()

        return ListingController.GET_listing(self, **env)
