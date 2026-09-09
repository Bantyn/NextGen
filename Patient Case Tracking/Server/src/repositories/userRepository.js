import { User } from '../models/User.js';

/**
 * User Repository — Data Access Layer for Users
 */
export class UserRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id) {
    return User.findById(id);
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async findAll({ role, isActive, skip = 0, limit = 20 } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (typeof isActive === 'boolean') filter.is_active = isActive;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total };
  }

  async updateRole(id, newRole) {
    return User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    );
  }

  async updateStatus(id, isActive) {
    return User.findByIdAndUpdate(
      id,
      { is_active: isActive },
      { new: true, runValidators: true }
    );
  }
}

export const userRepository = new UserRepository();
export default userRepository;
