module.exports = [
  {
    name: 'real-time',
  },
 ]

if (require.main === module) {
  for (const service of module.exports) {
    console.log(service.name)
  }
}
