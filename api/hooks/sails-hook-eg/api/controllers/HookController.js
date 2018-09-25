export async function test(req, res) {

  console.log('test method on ExampleController');
  console.log('test auto reload!!!!!!!!!!!!!!!!!!!!!!!');

  return res.ok({
    message: 'success',
  });
}