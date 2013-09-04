import re, os

def filename_to_link_title(filename):
    """
    guess a title for this file
    """

    name, ext = os.path.splitext(filename)
    ext = ext[1:]
    postfix = ''
    if ext:
        postfix = " [%s]" % (ext.upper(),)
    name = titlecase_with_exceptions(name.replace("_", " ").replace("-", " "))

    return "%s%s" % (name, postfix,)

def titlecase_with_exceptions(s):
    """
    Make a sentance title case, but don't capitalize English articles

    Adapted from http://stackoverflow.com/questions/3728655/python-titlecase-a-string-with-exceptions
    """
    exceptions = ['a', 'an', 'of', 'the', 'is']
    word_list = re.split(' ', s)       #re.split behaves as expected
    final = [word_list[0].capitalize()]
    for word in word_list[1:]:
        final.append(word in exceptions and word or word.capitalize())
    return " ".join(final)


def truncate_html_words(s, num):
    """
    Truncates html to a certain number of words (not counting tags and comments).
    Closes opened tags if they were correctly closed in the given html.
    """
    length = int(num)
    if length <= 0:
        return ''
    html4_singlets = ('br', 'col', 'link', 'base', 'img', 'param', 'area', 'hr', 'input')
    # Set up regular expressions
    re_words = re.compile(r'&.*?;|<.*?>|([A-Za-z0-9][\w-]*)')
    re_tag = re.compile(r'<(/)?([^ ]+?)(?: (/)| .*?)?>')
    # Count non-HTML words and keep note of open tags
    pos = 0
    ellipsis_pos = 0
    words = 0
    open_tags = []
    while words <= length:
        m = re_words.search(s, pos)
        if not m:
            # Checked through whole string
            break
        pos = m.end(0)
        if m.group(1):
            # It's an actual non-HTML word
            words += 1
            if words == length:
                ellipsis_pos = pos
            continue
        # Check for tag
        tag = re_tag.match(m.group(0))
        if not tag or ellipsis_pos:
            # Don't worry about non tags or tags after our truncate point
            continue
        closing_tag, tagname, self_closing = tag.groups()
        tagname = tagname.lower()  # Element names are always case-insensitive
        if self_closing or tagname in html4_singlets:
            pass
        elif closing_tag:
            # Check for match in open tags list
            try:
                i = open_tags.index(tagname)
            except ValueError:
                pass
            else:
                # SGML: An end tag closes, back to the matching start tag, all unclosed intervening start tags with omitted end tags
                open_tags = open_tags[i+1:]
        else:
            # Add it to the start of the open tags list
            open_tags.insert(0, tagname)
    if words <= length:
        # Don't try to close tags if we don't need to truncate
        return s
    out = s[:ellipsis_pos] + ' ...'
    # Close any tags still open
    for tag in open_tags:
        out += '</%s>' % tag
    # Return string
    return out

if __name__ == "__main__":
    import doctest
    doctest.testmod()

