const Bundler = require(`parcel-bundler`);
(async () => {
  const bundler = new Bundler(
    `./src/jp.js`, 
    { 
      target: `node`, 
      watch: false,
    })
  await bundler.bundle()
})()

