// 测试localStorage持久化功能
console.log('=== I18n Storage Test ===')

// 检查是否有localStorage数据
const savedTranslations = localStorage.getItem('i18n_translations')
console.log('1. Current localStorage data:', savedTranslations)

if (savedTranslations) {
  try {
    const parsed = JSON.parse(savedTranslations)
    console.log('2. Parsed translations:', parsed)
    console.log('3. Available languages:', Object.keys(parsed))
    
    // 检查具体语言的数据
    Object.keys(parsed).forEach(lang => {
      console.log(`4. ${lang} translations count:`, Object.keys(parsed[lang]).length)
      console.log(`5. Sample ${lang} data:`, Object.entries(parsed[lang]).slice(0, 3))
    })
  } catch (error) {
    console.error('Failed to parse localStorage data:', error)
  }
} else {
  console.log('2. No translations found in localStorage')
}

// 测试保存新数据
console.log('\n=== Testing Save Function ===')
const testData = {
  'en': {
    'test_key': 'Test English Value',
    'new_key': 'Another Test'
  },
  'zh-CN': {
    'test_key': '测试中文值',
    'new_key': '另一个测试'
  }
}

try {
  localStorage.setItem('i18n_translations', JSON.stringify(testData))
  console.log('6. Test data saved successfully')
  
  const verification = localStorage.getItem('i18n_translations')
  console.log('7. Verification - saved data exists:', !!verification)
} catch (error) {
  console.error('8. Failed to save test data:', error)
}

console.log('\n=== Test Complete ===')