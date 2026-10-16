const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const env = require('../src/config/env');

describe('Authentication API (/auth)', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    fullName: 'Jane Doe',
    userName: 'janedoe',
    phoneNumber: '+1234567890',
    termsAccepted: true,
  };

  describe('POST /auth/signup', () => {
    it('should successfully register a user with all valid fields', async () => {
      const res = await request(app).post('/auth/signup').send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
      expect(res.body).toHaveProperty('user');

      const { user } = res.body;
      expect(user).toHaveProperty('id');
      expect(user.email).toBe('test@example.com');
      expect(user.fullName).toBe('Jane Doe');
      expect(user.displayName).toBe('Jane Doe');
      expect(user.userName).toBe('janedoe');
      expect(user.phoneNumber).toBe('+1234567890');
      expect(user.termsAccepted).toBe(true);
      expect(user.emailVerified).toBe(false);

      // Verify NO password hash leakage in response
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('__v');

      // Verify password was properly hashed in database
      const dbUser = await User.findOne({ email: 'test@example.com' }).select('+passwordHash');
      expect(dbUser).not.toBeNull();
      expect(dbUser.passwordHash).not.toBe(testUser.password);
      const isPasswordValid = await dbUser.comparePassword(testUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should successfully register a user with minimal required fields (email and password)', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'minimal@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('minimal@example.com');
      expect(res.body.user.fullName).toBeNull();
      expect(res.body.user.userName).toBeNull();
      expect(res.body.user.displayName).toBe('minimal');
      expect(res.body.user.termsAccepted).toBe(false);
    });

    it('should allow multiple users with omitted/null usernames without duplicate key errors', async () => {
      const user1 = await request(app)
        .post('/auth/signup')
        .send({ email: 'nouser1@example.com', password: 'password123' });
      const user2 = await request(app)
        .post('/auth/signup')
        .send({ email: 'nouser2@example.com', password: 'password123' });

      expect(user1.status).toBe(201);
      expect(user2.status).toBe(201);
    });

    it('should reject registration if email is already in use (status 409)', async () => {
      await request(app).post('/auth/signup').send(testUser);

      // Attempt duplicate email with same case
      const res = await request(app).post('/auth/signup').send({
        email: testUser.email,
        password: 'differentpassword',
      });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error', 'This email is already in use.');
    });

    it('should enforce case-insensitive email uniqueness (status 409)', async () => {
      await request(app).post('/auth/signup').send({
        email: 'case@example.com',
        password: 'password123',
      });

      const res = await request(app).post('/auth/signup').send({
        email: 'CASE@EXAMPLE.COM',
        password: 'password123',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('This email is already in use.');
    });

    it('should enforce case-insensitive username uniqueness (status 409)', async () => {
      await request(app).post('/auth/signup').send({
        email: 'user1@example.com',
        password: 'password123',
        userName: 'CoolUser',
      });

      const res = await request(app).post('/auth/signup').send({
        email: 'user2@example.com',
        password: 'password123',
        userName: 'cooluser',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username is already taken.');
    });

    it('should reject invalid email format (status 400)', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'not-an-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email address.');
    });

    it('should reject password with less than 6 characters (status 400)', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'valid@example.com',
        password: '12345',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password should be at least six characters.');
    });

    it('should reject invalid username characters or length (status 400)', async () => {
      const res = await request(app).post('/auth/signup').send({
        email: 'valid@example.com',
        password: 'password123',
        userName: 'ab', // too short (< 3 chars)
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Username must be between 3 and 30 characters');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/signup').send(testUser);
    });

    it('should log in successfully with valid credentials and return token & public user', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should log in successfully with case-insensitive email', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'TEST@EXAMPLE.COM',
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should return 401 with generic message when password is wrong', async () => {
      const res = await request(app).post('/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });

    it('should return 401 with generic message when email does not exist', async () => {
      const res = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials.');
    });
  });

  describe('GET /auth/username-available', () => {
    beforeEach(async () => {
      await request(app).post('/auth/signup').send(testUser);
    });

    it('should report false for an existing username (case-insensitive)', async () => {
      const res = await request(app).get('/auth/username-available?userName=janedoe');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: false });

      const resUpper = await request(app).get('/auth/username-available?userName=JaneDoe');
      expect(resUpper.status).toBe(200);
      expect(resUpper.body).toEqual({ available: false });
    });

    it('should report true for an available username', async () => {
      const res = await request(app).get('/auth/username-available?userName=uniquename');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: true });
    });

    it('should support lowercase query param "username"', async () => {
      const res = await request(app).get('/auth/username-available?username=janedoe');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: false });
    });

    it('should report true for an empty username string', async () => {
      const res = await request(app).get('/auth/username-available?userName=');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ available: true });
    });
  });

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app).post('/auth/signup').send(testUser);
    });

    it('should return safe generic 200 response for an existing email without revealing account existence', async () => {
      const res = await request(app).post('/auth/forgot-password').send({
        email: testUser.email,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('If an account exists');
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).not.toHaveProperty('resetToken');
    });

    it('should return identical safe generic 200 response for a non-existent email', async () => {
      const res = await request(app).post('/auth/forgot-password').send({
        email: 'doesnotexist@example.com',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toContain('If an account exists');
    });

    it('should return 400 for an invalid email format', async () => {
      const res = await request(app).post('/auth/forgot-password').send({
        email: 'invalid-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid email address.');
    });
  });

  describe('GET /auth/me', () => {
    let validToken;
    let registeredUser;

    beforeEach(async () => {
      const signupRes = await request(app).post('/auth/signup').send(testUser);
      validToken = signupRes.body.token;
      registeredUser = signupRes.body.user;
    });

    it('should return 200 and current user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(registeredUser.id);
      expect(res.body.user.email).toBe(registeredUser.email);
      expect(res.body.user.displayName).toBe(registeredUser.displayName);
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('missing or malformed');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.string');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid authentication token.');
    });

    it('should return 401 when token is expired', async () => {
      // Create token expired 1 hour ago
      const expiredToken = jwt.sign(
        { sub: registeredUser.id, email: registeredUser.email },
        env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication token has expired.');
    });

    it('should return 401 when user associated with valid token has been deleted from MongoDB', async () => {
      // Delete the user from database
      await User.findByIdAndDelete(registeredUser.id);

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('no longer exists');
    });
  });
});
