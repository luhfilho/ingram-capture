class User
{
    constructor()
    {
        this.captured_at = '';
        this.network = '';
        this.user_id = '';
        this.username = '';
        this.name = '';
        this.is_verified = '';
        this.is_private = '';
        this.thumbnail = '';
        this.about = '';
        this.followers = '';
        this.following = '';
        this.media = '';
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

module.exports = User;