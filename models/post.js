class Post
{
    constructor()
    {
        this.captured_at = '';
        this.network = 'ig';
        this.user_id = '';
        this.post_id = '';
        this.post_type = 'post';
        this.media_code = '';
        this.interaction_type = '';
        this.created_at = '';
        this.display_url = '';
        this.thumbnail_url = '';
        this.likes = '';
        this.comments = '';
        this.views = '';
        this.text = '';
        this.tagged_users = '';
        this.owner = {};
        this.is_publipost = '';
        this.sponsor_username = '';
        this.locations = '';
    }

    /**
     * @param {string} name
     * @param {string | number} value
     * @returns {*}
     */
    set(name, value)
    {
        if(!(name in this))
        {
            throw name + " param does not exists";
        }
        this[name] = value;
        return value;
    }

    /**
     * 
     * @param {*} name 
     * @returns {*}
     */
    get(name)
    {
        return this[name];
    }

    get dump() {
        var response = {};
        for (var i in this) {
            if (typeof this[i] != 'function') {
                response[i] = this[i];
            }
        }
        return response;
    }
}

module.exports = Post;