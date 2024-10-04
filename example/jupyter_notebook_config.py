# ep_weave
import tempfile

c.ServerProxy.servers = {
  'ep_weave': {
    'command': lambda port: ['/opt/nbtags/bin/run-ep-proxy.sh', f'{port}'],
    'absolute_url': False,
    'timeout': 30,
  }
}
