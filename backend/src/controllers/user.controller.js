const prisma = require('../lib/prisma');

const getMe = async (req, res) => {
  const { password, ...user } = req.user;
  res.json(user);
};

const updateMe = async (req, res, next) => {
  const { name } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { ...(name && { name }) },
      select: { id: true, name: true, email: true, updatedAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMe, updateMe };
