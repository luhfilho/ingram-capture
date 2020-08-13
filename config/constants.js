var Config = {
    pubsub_project_id: 'PUBSUB_PROJECT_ID' in process.env ? process.env.PUBSUB_PROJECT_ID : 'airstrip-proj',
    pubsub_topic_name: 'PUBSUB_TOPIC_NAME_IG' in process.env ? process.env.PUBSUB_TOPIC_NAME_IG : 'capture_ig_posts',
    pubsub_topic_name_newuser: 'PUBSUB_TOPIC_NAME_NEWUSER_IG' in process.env ? process.env.PUBSUB_TOPIC_NAME_NEWUSER_IG : 'new_user_ig_posts',
    pubsub_subscription_name: 'PUBSUB_SUBSCRIPTION_NAME_IG' in process.env ? process.env.PUBSUB_SUBSCRIPTION_NAME_IG : 'sub_capture_ig_posts',
    pubsub_subscription_name_newuser: 'PUBSUB_SUBSCRIPTION_NAME_NEWUSER_IG' in process.env ? process.env.PUBSUB_SUBSCRIPTION_NAME_NEWUSER_IG : 'sub_new_user_ig_posts',
    pubsub_topic_name_postcapture: 'PUBSUB_TOPIC_NAME_POSTCAPTURE' in process.env ? process.env.PUBSUB_TOPIC_NAME_POSTCAPTURE : 'postcapture',
    pubsub_subscription_name_postcapture: 'PUBSUB_SUBSCRIPTION_NAME_POSTCAPTURE' in process.env ? process.env.PUBSUB_SUBSCRIPTION_NAME_POSTCAPTURE : 'sub_postcapture',
    network: 'ig',
};
module.exports = Config;
