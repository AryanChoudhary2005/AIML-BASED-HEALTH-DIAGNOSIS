import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
import os

IMG_SIZE = 224
BATCH_SIZE = 16

print("1. Setting up Data Pipelines...")
train_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.RandomRotation(10),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

test_transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# ⚠️ UPDATE THIS LINE to your actual folder path! ⚠️
base_dir = r"D:\ameeti2-20240921T044205Z-001\ameeti2\major project\Health-AI-Project\backend\chest_xray"

train_data = datasets.ImageFolder(root=os.path.join(base_dir, 'train'), transform=train_transform)
test_data = datasets.ImageFolder(root=os.path.join(base_dir, 'test'), transform=test_transform)

train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE, shuffle=False)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("2. Loading your 85% Accurate Brain...")
# Rebuild the exact structure
model = models.densenet121()
model.classifier = nn.Sequential(
    nn.Linear(1024, 256),
    nn.ReLU(),
    nn.Dropout(0.5),
    nn.Linear(256, 1)
)

# Load the memory from the last script
model.load_state_dict(torch.load("densenet_pneumonia.pth"))
model.to(device)

print("3. Performing Brain Surgery (Unfreezing Deep Vision Layers)...")
# We unfreeze ONLY the final Dense Block and the final classification layers
for name, param in model.named_parameters():
    if "features.denseblock4" in name or "features.norm5" in name or "classifier" in name:
        param.requires_grad = True
    else:
        param.requires_grad = False # Keep early layers (edges/shapes) safely frozen

# 4. The Microscopic Optimizer
# Standard learning rate is 0.001. We drop it to 0.00001 (1e-5) for careful adjustments
optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=1e-5)
criterion = nn.BCEWithLogitsLoss()

EPOCHS = 10 

print(f"\n🚀 STARTING SURGICAL FINE-TUNING (Target: {EPOCHS} Epochs)...")
print("WARNING: Backpropagation is now happening deep inside the network.")
print("Your GPU is going to sweat! This will take longer than last time...\n")

for epoch in range(EPOCHS):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for batch_idx, (images, labels) in enumerate(train_loader):
        images, labels = images.to(device), labels.float().unsqueeze(1).to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        predictions = torch.sigmoid(outputs) >= 0.5
        correct += (predictions == labels).sum().item()
        total += labels.size(0)
        
    epoch_acc = (correct / total) * 100
    print(f"✅ Epoch {epoch+1} Completed! Loss: {running_loss/len(train_loader):.4f} | Training Accuracy: {epoch_acc:.2f}%")

print("\n🎓 Administering Final Exam to Unseen Test Patients...")
model.eval()
test_correct = 0
test_total = 0

with torch.no_grad():
    for images, labels in test_loader:
        images, labels = images.to(device), labels.float().unsqueeze(1).to(device)
        outputs = model(images)
        predictions = torch.sigmoid(outputs) >= 0.5
        test_correct += (predictions == labels).sum().item()
        test_total += labels.size(0)

print("-" * 30)
print(f"🎯 FINE-TUNED REAL-WORLD TEST ACCURACY: {(test_correct / test_total) * 100:.2f}%")
print("-" * 30)

torch.save(model.state_dict(), "densenet_pneumonia_finetuned.pth")
print("Masterpiece Model saved as 'densenet_pneumonia_finetuned.pth'")