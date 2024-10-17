# ep_weave
import os
import tempfile

c.ServerProxy.servers = {
  'ep_weave': {
    'command': lambda port: ['/opt/nbtags/bin/run-ep-proxy.sh', f'{port}'],
    'absolute_url': False,
    'timeout': 30,
  }
}

# load additional config files
additional_config_path = os.environ.get('JUPYTER_ADDITIONAL_CONFIG_PATH',
                                        '/jupyter_notebook_config.d')
if os.path.exists(additional_config_path):
    for filename in sorted(os.listdir(additional_config_path)):
        _, ext = os.path.splitext(filename)
        if ext.lower() != '.py':
            continue
        load_subconfig(os.path.join(additional_config_path, filename))
