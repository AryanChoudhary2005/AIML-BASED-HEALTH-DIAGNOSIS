import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

print("Preparing the Final Exam...")

# 1. We have to rebuild the exact same empty brain structure
class PneumoniaCNN(nn.Module):
    def __init__(self):
        super(PneumoniaCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.conv4 = nn.Conv2d(128, 128, 3, padding=1)
        self.conv5 = nn.Conv2d(128, 128, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 16 * 16, 128)
        self.fc2 = nn.Linear(128, 1)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = self.pool(F.relu(self.conv4(x)))
        x = self.pool(F.relu(self.conv5(x)))
        x = torch.flatten(x, 1) 
        x = F.relu(self.fc1(x))
        x = self.fc2(x) 
        return x

# 2. Load the smart math we just saved!
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = PneumoniaCNN()
model.load_state_dict(torch.load("pneumonia_model_512.pth"))
model.to(device)
model.eval() # ⚠️ CRITICAL: Puts the brain in "Test Only" mode (no learning allowed)

# 3. Prepare the hidden test data
transform = transforms.Compose([
    transforms.Resize((512, 512)),
    transforms.Grayscale(num_output_channels=1),
    transforms.ToTensor()
])

# UPDATE THIS PATH just like you did in the training script
base_dir = r"D:\ameeti2-20240921T044205Z-001\ameeti2\major project\Health-AI-Project\backend\chest_xray"
test_data = datasets.ImageFolder(root=os.path.join(base_dir, 'test'), transform=transform)
test_loader = DataLoader(test_data, batch_size=8, shuffle=False)

# 4. Take the Exam!
correct = 0
total = 0

print("Administering tests to 624 unseen patients. Please wait...")

# torch.no_grad() tells the GPU not to track math for learning, making this run 10x faster
with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.float().unsqueeze(1).to(device)
        outputs = model(images)
        predictions = torch.sigmoid(outputs) >= 0.5
        correct += (predictions == labels).sum().item()
        total += labels.size(0)

# 5. The True Grade
true_accuracy = (correct / total) * 100
print("-" * 30)
print(f"🎯 REAL-WORLD TEST ACCURACY: {true_accuracy:.2f}%")
print("-" * 30)