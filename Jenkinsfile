pipeline {
    agent any

    environment {
        REPO_URL = "https://github.com/DatLe328/He-Thong-Dat-Lich-Kham.git"
        BRANCH = "main"
        FLASK_ENV=development
        DB_USER=root
        DB_PASSWORD=12345
        DB_HOST=localhost
        DB_PORT=3306
        DB_NAME=mydb
    }
    
    stages {
        stage('Setup System Environment') {
            steps {
                echo 'Checking and installing Python 3...'
                sh '''
                    apt-get update && apt-get install -y python3 python3-pip python3-venv || \
                    echo "Python already installed or no permission to install"
                '''
            }
        }

        stage('Clone Repo') {
            steps {
                deleteDir()
                sh "git clone -b ${BRANCH} ${REPO_URL} ."
            }
        }

        stage('Install & Test Run') {
            steps {
                dir('backend') {
                    sh '''
                        PYTHON_CMD=$(which python3)
                        echo "Using Python at: $PYTHON_CMD"
                        
                        $PYTHON_CMD -m venv venv
                        . venv/bin/activate
                        
                        pip install --no-cache-dir -r requirements.txt
                        
                        echo "--- Testing App Startup ---"
                        timeout 5s python app.py || if [ $? -eq 124 ]; then echo "App runs fine!"; else echo "App failed"; exit 1; fi
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Done!"
        }
    }
}
