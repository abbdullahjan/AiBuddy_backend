const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required.'],
      select: false, // Hidden by default from queries
    },
    fullName: {
      type: String,
      trim: true,
      default: null,
    },
    userName: {
      type: String,
      trim: true,
      default: null,
    },
    userNameLower: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: null,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    photoUrl: {
      type: String,
      default: null,
    },
    userType: {
      type: String,
      default: 'user',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.displayName = ret.fullName || ret.userName || (ret.email ? ret.email.split('@')[0] : null);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.userNameLower;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.displayName = ret.fullName || ret.userName || (ret.email ? ret.email.split('@')[0] : null);
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.userNameLower;
        return ret;
      },
    },
  }
);

// Keep userNameLower in sync with userName
userSchema.pre('save', function () {
  if (this.isModified('userName')) {
    if (this.userName && typeof this.userName === 'string' && this.userName.trim().length > 0) {
      this.userName = this.userName.trim();
      this.userNameLower = this.userName.toLowerCase();
    } else {
      this.userName = null;
      this.userNameLower = null;
    }
  }

  if (this.isModified('email') && this.email) {
    this.email = this.email.trim().toLowerCase();
  }
});

// Enforce unique username only when userNameLower is a non-null string
userSchema.index(
  { userNameLower: 1 },
  {
    unique: true,
    partialFilterExpression: { userNameLower: { $type: 'string' } },
  }
);

// Password comparison method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method for password hashing
userSchema.statics.hashPassword = async function (plainPassword) {
  const saltRounds = 10;
  return bcrypt.hash(plainPassword, saltRounds);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
