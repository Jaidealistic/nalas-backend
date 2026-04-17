process.env.NODE_ENV = 'test';
try {
  const app = require('../src/app');
  app._router.stack.forEach(function(r){
    if (r.route && r.route.path){
      console.log('Path:', r.route.path);
    } else if (r.name === 'router') {
      console.log('Router regexp:', r.regexp);
    }
  });
} catch (err) {
  console.error(err);
}
