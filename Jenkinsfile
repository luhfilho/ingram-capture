import java.text.SimpleDateFormat

def helmLint(String chart_dir) {
    // lint helm chart
    sh "/usr/local/bin/helm lint ${chart_dir}"
}

def helmDeploy(Map args) {
    //configure helm client and confirm tiller process is installed
    if(args.context){
        if (args.dry_run) {
            println "Running dry-run deployment"
            sh "/usr/local/bin/helm upgrade --dry-run --debug -f ${args.chart_dir}/${args.namespace}.values.yaml --namespace ${args.namespace} --set image.tag=${args.image_tag},image.repository=gcr.io/${args.image_name} --kube-context ${args.context} --install ${args.name} ${args.chart_dir}"
        } else {
            println "Running deployment"
            sh "/usr/local/bin/helm upgrade --install ${args.name} -f ${args.chart_dir}/${args.namespace}.values.yaml --namespace ${args.namespace} --set image.tag=${args.image_tag},image.repository=gcr.io/${args.image_name} --kube-context ${args.context} ${args.chart_dir}"
            echo "Application ${args.name} successfully deployed. Use helm status ${args.name} to check"
        }
    } else {
        println "Context not set"
    }
}

docker.withRegistry('https://gcr.io', 'gcr:gcr-credentials') {
    stage('checkout'){
        checkout scm
    }

    namespace = env.BRANCH_NAME == 'master' ? 'prod' : env.BRANCH_NAME

    def rootDir = pwd()
    // Change BELOW
    def chart_dir = "./chart/air-capture--simple-instagram-capture"
    // Change ABOVE

    config_file = chart_dir + "/values.yaml"
    def config = readYaml file: config_file

    def full_gcr_image_path = config.image.repository
    // split example: gcr.io/airstrip-proj/air-services/airfluencers-listcard-metrics
    def split = full_gcr_image_path.split("/")

    // air-services for scope and airfluencers-listcard-metrics for project_name for example
    def project_scope = split[2]
    def project_name = split[3]

    def release_name = project_scope + '--' + project_name
    def date = new Date()
    sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss")
    env.TIMESTAMP = sdf.format(date)

    env.KUBE_NAMESPACE = namespace
    env.KUBE_CONTEXT = env.BRANCH_NAME == 'master' ? 'gke_airstrip-proj_us-central1-a_airstrip-kube-1' : 'gke_airstrip-proj_us-central1-a_iowa-stage'

    def myImage_python = null

    def image_name = 'airstrip-proj/' + project_scope + '/' + project_name
    def image_tag = env.BRANCH_NAME == 'master' ? '${BUILD_NUMBER}-prod' : '${BUILD_NUMBER}-${BRANCH_NAME}'
    stage('build'){
          myImage_python = docker.build(image_name+':'+image_tag, "-f ./Dockerfile .")
    }
    stage('push gcr'){
        if (env.KUBE_NAMESPACE == 'prod'){
              myImage_python.push '${BUILD_NUMBER}-${KUBE_NAMESPACE}'
              myImage_python.push 'latest-${KUBE_NAMESPACE}'
        }
        if (env.KUBE_NAMESPACE == 'stage'){
              myImage_python.push '${BUILD_NUMBER}-${KUBE_NAMESPACE}'
              myImage_python.push 'latest-${KUBE_NAMESPACE}'
        }
    }
    stage ('helm test') {
      // run helm chart linter
      helmLint(chart_dir)

      // run dry-run helm chart installation
      helmDeploy(
        dry_run       : true,
        name          : release_name,
        chart_dir     : chart_dir,
        context       : env.KUBE_CONTEXT,
        namespace     : env.KUBE_NAMESPACE,
        image_name    : image_name,
        image_tag     : image_tag
       )
    }
    stage ('helm deploy') {
      // Deploy using Helm chart
      helmDeploy(
        dry_run       : false,
        name          : release_name,
        chart_dir     : chart_dir,
        context       : env.KUBE_CONTEXT,
        namespace     : env.KUBE_NAMESPACE,
        image_name    : image_name,
        image_tag     : image_tag
      )
    }
}

