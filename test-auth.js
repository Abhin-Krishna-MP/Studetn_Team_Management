const { Student } = require('./models');

async function testAuth() {
  try {
    console.log('Testing authentication...\n');
    
    // Find student
    const student = await Student.findOne({
      where: { email: 'alice@university.edu' }
    });
    
    if (!student) {
      console.log('❌ Student not found');
      process.exit(1);
    }
    
    console.log('✅ Student found:', {
      id: student.student_id,
      name: student.name,
      email: student.email,
      hasPassword: !!student.password,
      passwordLength: student.password?.length
    });
    
    // Test comparePassword method
    if (!student.comparePassword) {
      console.log('❌ comparePassword method not found');
      process.exit(1);
    }
    
    console.log('✅ comparePassword method exists');
    
    // Test password comparison
    try {
      const isValid = await student.comparePassword('password123');
      console.log('✅ Password comparison result:', isValid);
      
      if (!isValid) {
        console.log('\n⚠️  Password is not valid!');
        console.log('This means the stored password hash does not match.');
        console.log('You may need to re-create the user.');
      }
    } catch (error) {
      console.log('❌ Error comparing password:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAuth();
