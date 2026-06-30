const PuterImageGen = require('./app/clients/tools/structured/PuterImageGen');

console.log('Testing PuterImageGen tool initialization...');

try {
  const toolInstance = new PuterImageGen({ override: true });
  console.log('Tool instance created successfully!');
  console.log('Tool name:', toolInstance.name);
  console.log('Tool description:', toolInstance.description);
  console.log('Tool schema:', toolInstance.schema);
} catch (error) {
  console.error('Error instantiating PuterImageGen:', error);
}
