const ProfileScript = {
  entry: './profile.js',
  mode: 'none',
  output: {
    filename: './public/javascripts/auth/profilebundle.js',
    path: __dirname,
  },
  optimization: {
    minimize: true
  }
};

const MainScript = {
  entry: './script.js',
  mode: 'none',
  output: {
    filename: './public/javascripts/bundle.js',
    path: __dirname,
  },
  optimization: {
    minimize: true
  }
};

const AdminScript = {
  entry: './admin.js',
  mode: 'none',
  output: {
    filename: './public/javascripts/admin/admin.js',
    path: __dirname,
  },
  optimization: {
    minimize: true
  }
};

module.exports = [ ProfileScript, MainScript, AdminScript ];

// module.exports = {
//   entry: './script.js',
//   mode: 'none',
//   output: {
//     filename: './public/javascripts/bundle.js',
//     path: __dirname,
//   },
//   watch: true,
//   optimization: {
//     minimize: true
//   }
// }