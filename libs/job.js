const PubSubQueue = require('pubsub-queue');
class Job
{
    constructor(project_id, topic_name, subscription_name)
    {
        this.project_id = project_id;
        this.topic_name = topic_name;
        this.subscription_name = subscription_name;
        this.pubSubQueue = new PubSubQueue(this.project_id, this.topic_name);
    }

    async getJob(limit)
    {
        let self = this;
        let response = [];
        let all_items = [];
        let items = [];
        try {
            all_items = await this.pubSubQueue.getJob(this.subscription_name, limit);
            items = all_items.payload.receivedMessages;
        } catch (e) {
            if (e.details == 'Deadline Exceeded')
            {
                console.log('No jobs found');
            }
            else
            {
                console.log(e);
            }
        }

        for(var i in items)
        {
            let item = items[i];
            let data = item.message.data.toString('utf-8');
            let data_string = new Buffer(data, 'base64').toString('utf8');
            let data_json = JSON.parse(data_string);
            const job = {
                'term': data_json.username,
                'capture': { 'start': null, 'end': data_json.capture_period },
                'client': all_items.client,
                'subscription_path': all_items.subscription_path,
                'ackIds': [item.ackId],
            }

            if(self.subscription_name == 'sub_new_user_ig_posts')
            {
              job['new_user'] = true;
            }

            const ackRequest = {
                subscription: all_items.subscription_path,
                ackIds: job.ackIds,
            };
            var ack = await all_items.client.acknowledge(ackRequest);
            response.push(job);
        }

        return response;
    }


    async sendJob(content, job)
    {
        let self = this;
        let all_responses = [];
        let json_response = {
            'type': job['type'],
            'network': content.network,
            'data': content,
        };

        if ('new_user' in job && job['new_user'] === true) {
            json_response['new_user'] = job.new_user;
            console.log('new_user => ', json_response['new_user']);
        }

        const ack_id_response = await self.pubSubQueue.sendJob(json_response);
        json_response['ackid'] = ack_id_response;
        all_responses.push(json_response);

        return all_responses;
    }

    async closeJob(job)
    {
        const ackRequest = {
            subscription: job.subscription_path,
            ackIds: job.ackIds,
        };
        console.log(ackRequest);
        var item = await job.client.acknowledge(ackRequest);

        console.log(item);

        return item;
    }
}

module.exports = Job;
