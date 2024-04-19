module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        userID: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            primaryKey: true
        },
        coins: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        lastCreditedMessageTimestamp: {
            type: DataTypes.INTEGER,
        }
    });
    
    return User;
}