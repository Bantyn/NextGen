import { User } from '../models/User.js';

/**
 * User Repository — Data Access Layer for Users
 */
export class UserRepository {
  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async findByPhone(phone) {
    if (!phone) return null;
    const cleanDigits = String(phone).replace(/[^0-9]/g, '');
    const last10 = cleanDigits.slice(-10);
    if (!last10) return null;
    return User.findOne({
      phone: { $regex: `${last10}$`, $options: 'i' },
    });
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
      { returnDocument: 'after', runValidators: true }
    );
  }

  async updateStatus(id, isActive) {
    return User.findByIdAndUpdate(
      id,
      { is_active: isActive },
      { returnDocument: 'after', runValidators: true }
    );
  }

  async findDoctors(filter = {}) {
    return User.find({ role: 'DOCTOR', ...filter });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
